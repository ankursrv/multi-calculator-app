import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Linking, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import {
  CLOUD_ENABLED,
  upsertLocationShare,
  pullLocationShares,
  expireLocationShare,
  deleteLocationShare,
  ensureFamilyRegistered,
} from '../lib/locationApi';
import { makeFamilyCode, normalizeFamilyCode } from '../lib/supabaseConfig';
import { readMeta } from '../lib/kharchaSync';
import { LOCATION_SHARE_TASK } from '../lib/locationBackgroundTask';

const STORAGE_KEY_DEVICE_ID = '@location_share_device_id';
const STORAGE_KEY_DEVICE_NAME = '@location_share_device_name';
const STORAGE_KEY_FAMILY_CODE = '@location_share_family_code';
const STORAGE_KEY_SESSION = '@location_share_session';

// Push location every 15 seconds when active
const LOCATION_INTERVAL_MS = 15_000;
// Partner refresh interval: 15 seconds
const PULL_INTERVAL_MS = 15_000;
// 1 hour expiry
const SHARE_TTL_MS = 60 * 60 * 1000;
// High accuracy (GPS-first) — "Balanced" se ~100 m doori hoti hai, jisse do phone
// ek room mein bhi 250 m door dikhte hain. Live location ke liye accuracy zaroori hai.
const LOCATION_ACCURACY = Location.Accuracy.High;

// Haversine formula to compute distance in km
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Earth's radius in km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) return null;
  // Distance meter mein dikhao (km ki jagah) — chhoti dooriyan "0.x km" ki tarah
  // lambi nahi lagti, aur 1-meter precision bhi dikhta hai.
  const meters = Math.round(distanceKm * 1000);
  return `${meters} m`;
}

export function formatTimeAgo(ts) {
  if (!ts) return '--';
  const diffSec = Math.max(0, Math.floor((Date.now() - Number(ts)) / 1000));
  if (diffSec < 15) return 'Abhi (Just now)';
  if (diffSec < 60) return `${diffSec} sec pehle`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min pehle`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ghante pehle`;
  return new Date(ts).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function openInGoogleMaps(lat, lng, label = 'Location') {
  if (!lat || !lng) return;
  const cleanLabel = encodeURIComponent(label);
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const nativeUrl = Platform.select({
    ios: `maps:0,0?q=${cleanLabel}@${lat},${lng}`,
    android: `geo:0,0?q=${lat},${lng}(${cleanLabel})`,
    default: webUrl,
  });

  Linking.canOpenURL(nativeUrl)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(nativeUrl);
      }
      return Linking.openURL(webUrl);
    })
    .catch(() => {
      Linking.openURL(webUrl).catch(() => {});
    });
}

export function openDirections(destLat, destLng, origLat, origLng) {
  if (!destLat || !destLng) return;
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
  if (origLat && origLng) {
    url += `&origin=${origLat},${origLng}`;
  }
  Linking.openURL(url).catch(() => {});
}

export async function shareLocationLink({ familyCode, deviceName, latitude, longitude }) {
  try {
    let msg = `📍 Live Location - ${deviceName || 'Partner'}\n`;
    if (familyCode) {
      msg += `Family Code: ${familyCode}\nMulti-Calc App me Live Location dekhne ke liye yahi code use karein.\n\n`;
    }
    if (latitude && longitude) {
      msg += `Google Maps link: https://www.google.com/maps?q=${latitude},${longitude}`;
    }
    await Share.share({
      message: msg,
      title: 'Live Location Share',
    });
  } catch (_e) {
    // Ignore share cancel
  }
}

export function useLocationShare() {
  const { currentUser } = useAuth();

  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceNameState] = useState('');
  const [familyCode, setFamilyCodeState] = useState('');
  const [existingKharchaCode, setExistingKharchaCode] = useState(null);

  const [permissionStatus, setPermissionStatus] = useState({
    foregroundGranted: false,
    backgroundGranted: false,
    canAskAgain: true,
    checked: false,
  });

  const [isSharing, setIsSharing] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [partnerLocations, setPartnerLocations] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);
  const lastPushRef = useRef(0);
  const lastCoordsRef = useRef(null);
  const pullIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const familyCodeRef = useRef('');
  const deviceNameRef = useRef('');
  const deviceIdRef = useRef('');

  // 1. Initialize persistent Device ID, Device Name & Family Code
  useEffect(() => {
    let isMounted = true;
    const initStorage = async () => {
      try {
        // Device ID
        let devId = await AsyncStorage.getItem(STORAGE_KEY_DEVICE_ID);
        if (!devId) {
          devId = `dev_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36).slice(-4)}`;
          await AsyncStorage.setItem(STORAGE_KEY_DEVICE_ID, devId);
        }
        if (isMounted) {
          setDeviceId(devId);
          deviceIdRef.current = devId;
        }

        // Device Name
        const storedName = await AsyncStorage.getItem(STORAGE_KEY_DEVICE_NAME);
        const preferredName =
          storedName || (currentUser && currentUser.name) || `Device-${devId.slice(-4)}`;
        if (isMounted) {
          setDeviceNameState(preferredName);
          deviceNameRef.current = preferredName;
        }

        // Family Code from storage
        const storedCode = await AsyncStorage.getItem(STORAGE_KEY_FAMILY_CODE);
        if (storedCode && isMounted) {
          setFamilyCodeState(storedCode);
          familyCodeRef.current = storedCode;
        }

        // Check if user has Kharcha Tracker family code
        const kharchaMeta = await readMeta(currentUser ? String(currentUser.id) : 'guest');
        if (kharchaMeta && kharchaMeta.familyCode && isMounted) {
          setExistingKharchaCode(kharchaMeta.familyCode);
          if (!storedCode) {
            setFamilyCodeState(kharchaMeta.familyCode);
            familyCodeRef.current = kharchaMeta.familyCode;
          }
        }
      } catch (_e) {
        // storage fallback
      }
    };
    initStorage();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Keep ref in sync when deviceName changes
  const setDeviceName = useCallback(async (name) => {
    const trimmed = String(name || '').trim();
    setDeviceNameState(name);
    deviceNameRef.current = trimmed;
    if (trimmed) {
      await AsyncStorage.setItem(STORAGE_KEY_DEVICE_NAME, trimmed).catch(() => {});
    }
  }, []);

  // Keep ref in sync when familyCode changes
  const setFamilyCode = useCallback(async (code) => {
    const normalized = normalizeFamilyCode(code) || String(code || '').toUpperCase().trim();
    setFamilyCodeState(normalized);
    familyCodeRef.current = normalized;
    if (normalized.length >= 8) {
      await AsyncStorage.setItem(STORAGE_KEY_FAMILY_CODE, normalized).catch(() => {});
    }
  }, []);

  // Generate a random valid 8-character family code
  const generateNewCode = useCallback(async () => {
    const newCode = makeFamilyCode();
    await setFamilyCode(newCode);
    if (CLOUD_ENABLED) {
      await ensureFamilyRegistered(newCode);
    }
    return newCode;
  }, [setFamilyCode]);

  // 2. Permission checks: Safe for Android, iOS & Web
  const checkPermissions = useCallback(async () => {
    try {
      const fgStatus = await Location.getForegroundPermissionsAsync();
      const fgGranted = fgStatus?.granted === true || fgStatus?.status === Location.PermissionStatus.GRANTED;

      let bgGranted = false;
      if (Platform.OS !== 'web' && fgGranted) {
        try {
          const bgStatus = await Location.getBackgroundPermissionsAsync();
          bgGranted = bgStatus?.granted === true || bgStatus?.status === Location.PermissionStatus.GRANTED;
        } catch (_bgErr) {
          bgGranted = false;
        }
      }

      const statusObj = {
        foregroundGranted: fgGranted,
        backgroundGranted: bgGranted,
        canAskAgain: fgStatus?.canAskAgain ?? true,
        checked: true,
      };
      setPermissionStatus(statusObj);
      return statusObj;
    } catch (_err) {
      const statusObj = {
        foregroundGranted: false,
        backgroundGranted: false,
        canAskAgain: true,
        checked: true,
      };
      setPermissionStatus(statusObj);
      return statusObj;
    }
  }, []);

  const requestForegroundPermission = useCallback(async () => {
    try {
      setError(null);
      const req = await Location.requestForegroundPermissionsAsync();
      const fgGranted = req?.granted === true || req?.status === Location.PermissionStatus.GRANTED;

      let bgGranted = false;
      if (Platform.OS !== 'web' && fgGranted) {
        try {
          const bgStatus = await Location.getBackgroundPermissionsAsync();
          bgGranted = bgStatus?.granted === true || bgStatus?.status === Location.PermissionStatus.GRANTED;
        } catch (_bgErr) {
          bgGranted = false;
        }
      }

      const statusObj = {
        foregroundGranted: fgGranted,
        backgroundGranted: bgGranted,
        canAskAgain: req?.canAskAgain ?? true,
        checked: true,
      };
      setPermissionStatus(statusObj);
      if (!fgGranted) {
        setError('Location sharing ke liye GPS permission zaroori hai.');
      }
      return statusObj;
    } catch (_err) {
      setError('GPS permission request me samasya aayi.');
      return { foregroundGranted: false, backgroundGranted: false, canAskAgain: true, checked: true };
    }
  }, []);

  const requestBackgroundPermission = useCallback(async () => {
    if (Platform.OS === 'web') return false;
    try {
      const req = await Location.requestBackgroundPermissionsAsync();
      const bgGranted = req?.granted === true || req?.status === Location.PermissionStatus.GRANTED;
      setPermissionStatus((prev) => ({ ...prev, backgroundGranted: bgGranted }));
      return bgGranted;
    } catch (_err) {
      return false;
    }
  }, []);

  // Initial check on mount via async worker to avoid cascading renders
  useEffect(() => {
    let active = true;
    Location.getForegroundPermissionsAsync()
      .then((fgStatus) => {
        if (!active) return;
        const fgGranted = fgStatus?.granted === true || fgStatus?.status === Location.PermissionStatus.GRANTED;
        let bgPromise = Promise.resolve(false);
        if (Platform.OS !== 'web' && fgGranted) {
          bgPromise = Location.getBackgroundPermissionsAsync()
            .then((bgStatus) => bgStatus?.granted === true || bgStatus?.status === Location.PermissionStatus.GRANTED)
            .catch(() => false);
        }
        return bgPromise.then((bgGranted) => {
          if (!active) return;
          setPermissionStatus({
            foregroundGranted: fgGranted,
            backgroundGranted: bgGranted,
            canAskAgain: fgStatus?.canAskAgain ?? true,
            checked: true,
          });
        });
      })
      .catch(() => {
        if (active) {
          setPermissionStatus({
            foregroundGranted: false,
            backgroundGranted: false,
            canAskAgain: true,
            checked: true,
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Reverse geocoding helper to get friendly locality name
  const resolveAddress = useCallback(async (latitude, longitude) => {
    if (Platform.OS === 'web' || !latitude || !longitude) return null;
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const item = results[0];
        const parts = [
          item.name || item.street,
          item.district || item.subregion,
          item.city,
        ].filter(Boolean);
        return parts.join(', ') || item.city || item.region || null;
      }
    } catch (_e) {
      return null;
    }
    return null;
  }, []);

  // 3. Push own location to Supabase
  const pushLocation = useCallback(
    async (coords) => {
      const currentCode = familyCodeRef.current;
      const currentDevName = deviceNameRef.current || 'My Device';
      const currentDevId = deviceIdRef.current;

      if (!currentCode || currentCode.length < 8) return;

      try {
        let activeCoords = coords;
        if (!activeCoords) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: LOCATION_ACCURACY,
          });
          activeCoords = loc.coords;
        }

        if (!activeCoords || activeCoords.latitude == null || activeCoords.longitude == null) {
          return;
        }

        lastCoordsRef.current = activeCoords;
        lastPushRef.current = Date.now();

        // Build address asynchronously
        let address = null;
        try {
          address = await resolveAddress(activeCoords.latitude, activeCoords.longitude);
        } catch (_e) {
          // fallback
        }

        const shareId = `${currentCode}_${currentDevId}`;
        const share = {
          id: shareId,
          family_code: currentCode,
          device_name: currentDevName,
          latitude: activeCoords.latitude,
          longitude: activeCoords.longitude,
          accuracy: activeCoords.accuracy != null ? Math.round(activeCoords.accuracy) : null,
          updated_at: Date.now(),
          expires_at: Date.now() + SHARE_TTL_MS,
        };

        if (CLOUD_ENABLED) {
          await ensureFamilyRegistered(currentCode);
          await upsertLocationShare(share);
        }

        setMyLocation({
          latitude: activeCoords.latitude,
          longitude: activeCoords.longitude,
          accuracy: share.accuracy,
          updated_at: share.updated_at,
          address,
        });
      } catch (_err) {
        // Silent retry on next interval
      }
    },
    [resolveAddress]
  );

  // 4. Pull partner locations from Supabase
  const refreshPartners = useCallback(async () => {
    const currentCode = familyCodeRef.current;
    const currentDevId = deviceIdRef.current;
    if (!currentCode || currentCode.length < 8) {
      setPartnerLocations([]);
      return;
    }

    setIsRefreshing(true);
    try {
      const myShareId = `${currentCode}_${currentDevId}`;
      const rows = await pullLocationShares(currentCode);

      if (Array.isArray(rows)) {
        const now = Date.now();
        // Filter out own device, explicitly stopped rows (expires_at = 0) and
        // stale rows. updated_at is written by a server-side trigger, so we trust
        // it over the client-set expires_at and stay immune to phone clock skew.
        const partners = rows
          .filter((r) => r && r.id !== myShareId)
          .filter((r) => {
            const updatedAt = Number(r.updated_at) || 0;
            const expiresAt = Number(r.expires_at) || 0;
            if (expiresAt === 0) return false; // device ne sharing band ki
            if (updatedAt > 0) return now - updatedAt < SHARE_TTL_MS;
            return expiresAt > now; // purani rows ka fallback
          })
          .map((p) => {
            let dist = null;
            // Distance tab sirf tab compute karo jab meri own location fresh ho
            // (last 30 sec). Stale GPS se aayi doori "bada" dikhti hai aur galat
            // impression deti hai — us case mein distance hide karke Live badge dikhao.
            const myLocationFresh =
              lastCoordsRef.current && now - lastPushRef.current <= 30_000;
            if (
              myLocationFresh &&
              p.latitude != null &&
              p.longitude != null
            ) {
              dist = calculateDistanceKm(
                lastCoordsRef.current.latitude,
                lastCoordsRef.current.longitude,
                p.latitude,
                p.longitude
              );
            }
            return {
              ...p,
              distanceKm: dist,
              formattedDistance: formatDistance(dist),
            };
          });

        setPartnerLocations(partners);
      }
    } catch (_err) {
      // Ignore network hiccup
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 5. Start live location sharing
  const startSharing = useCallback(
    async (codeToUse) => {
      const targetCode = String(codeToUse || familyCodeRef.current || '').toUpperCase().trim();
      if (!targetCode || targetCode.length < 8) {
        setError('Kripya kam se kam 8-akshar ka Family Code darj karein.');
        return false;
      }

      setError(null);

      // Verify or request GPS permission
      let perms = permissionStatus;
      if (!perms.foregroundGranted) {
        perms = await requestForegroundPermission();
        if (!perms.foregroundGranted) {
          setError('Live location share karne ke liye GPS permission zaroori hai.');
          return false;
        }
      }

      // Ensure code is registered in Supabase
      if (CLOUD_ENABLED) {
        await ensureFamilyRegistered(targetCode);
      }

      await setFamilyCode(targetCode);
      setIsSharing(true);

      // Save active session
      await AsyncStorage.setItem(
        STORAGE_KEY_SESSION,
        JSON.stringify({ familyCode: targetCode, isSharing: true, startedAt: Date.now() })
      ).catch(() => {});

      // 1. Initial push immediately
      await pushLocation();

      // 2. Start continuous GPS watch
      try {
        if (watchIdRef.current) {
          watchIdRef.current.remove();
        }

        watchIdRef.current = await Location.watchPositionAsync(
          {
            accuracy: LOCATION_ACCURACY,
            distanceInterval: 10,
            timeInterval: LOCATION_INTERVAL_MS,
          },
          (loc) => {
            if (loc && loc.coords) {
              const now = Date.now();
              if (now - lastPushRef.current >= 8_000) {
                pushLocation(loc.coords);
              }
            }
          }
        );
      } catch (_watchErr) {
        // Fallback: If watchPosition fails, periodic heartbeat handles updates
      }

      // 2b. Background updates — keeps sharing alive when the app is backgrounded.
      // Requires a development build (not Expo Go) + background location permission.
      if (Platform.OS !== 'web') {
        try {
          await Location.startLocationUpdatesAsync(LOCATION_SHARE_TASK, {
            accuracy: LOCATION_ACCURACY,
            distanceInterval: 10,
            deferredUpdatesDistance: 50,
            deferredUpdatesInterval: LOCATION_INTERVAL_MS,
            foregroundService: {
              notificationTitle: 'Live Location Share',
              notificationBody: 'Aapki live location partner ke saath share ho rahi hai.',
              notificationColor: '#10B981',
              killServiceOnDestroy: false,
            },
            pausesUpdatesAutomatically: false,
            showsBackgroundLocationIndicator: true,
          });
        } catch (_bgErr) {
          // Expo Go / permission denied — foreground watch + heartbeat still work.
        }
      }

      // 3. Heartbeat interval every 20s (refreshes TTL even if standing still)
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = setInterval(() => {
        pushLocation(lastCoordsRef.current);
      }, 20_000);

      // 4. Partner polling interval every 15s
      if (pullIntervalRef.current) {
        clearInterval(pullIntervalRef.current);
      }
      pullIntervalRef.current = setInterval(refreshPartners, PULL_INTERVAL_MS);
      refreshPartners();

      return true;
    },
    [permissionStatus, requestForegroundPermission, setFamilyCode, pushLocation, refreshPartners]
  );

  // 6. Stop live sharing
  const stopSharing = useCallback(async () => {
    if (watchIdRef.current) {
      watchIdRef.current.remove();
      watchIdRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (pullIntervalRef.current) {
      clearInterval(pullIntervalRef.current);
      pullIntervalRef.current = null;
    }

    // Stop the background location foreground service (native only)
    if (Platform.OS !== 'web') {
      try {
        await Location.stopLocationUpdatesAsync(LOCATION_SHARE_TASK);
      } catch (_e) {
        // not running / not available
      }
    }

    const currentCode = familyCodeRef.current;
    const currentDevId = deviceIdRef.current;
    if (currentCode && currentDevId && CLOUD_ENABLED) {
      const shareId = `${currentCode}_${currentDevId}`;
      await expireLocationShare(shareId);
      await deleteLocationShare(shareId);
    }

    await AsyncStorage.removeItem(STORAGE_KEY_SESSION).catch(() => {});

    setIsSharing(false);
    setPartnerLocations([]);
    setMyLocation(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        watchIdRef.current.remove();
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (pullIntervalRef.current) {
        clearInterval(pullIntervalRef.current);
      }
      if (Platform.OS !== 'web') {
        Location.stopLocationUpdatesAsync(LOCATION_SHARE_TASK).catch(() => {});
      }
    };
  }, []);

  return {
    isCloudEnabled: CLOUD_ENABLED,
    deviceId,
    deviceName,
    setDeviceName,
    familyCode,
    setFamilyCode,
    existingKharchaCode,
    generateNewCode,
    permissionStatus,
    checkPermissions,
    requestForegroundPermission,
    requestBackgroundPermission,
    isSharing,
    myLocation,
    partnerLocations,
    isRefreshing,
    error,
    setError,
    startSharing,
    stopSharing,
    refreshPartners,
  };
}
