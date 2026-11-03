import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = '@app_auth_user';
const GUEST_EXPENSES_KEY = 'kharchaTrackerData';

export function getUserBadgeInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const clean = name.trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AuthContext = createContext(null);

// Ensure user's personal storage is strictly separate from guest storage
export async function purgeGuestItemsFromUser(userId) {
  if (!userId) return;
  try {
    const guestRaw = await AsyncStorage.getItem(GUEST_EXPENSES_KEY);
    if (!guestRaw) return;
    const guestData = JSON.parse(guestRaw);
    if (!guestData || typeof guestData !== 'object') return;

    const guestIds = new Set();
    Object.values(guestData).forEach((items) => {
      if (Array.isArray(items)) {
        items.forEach((item) => {
          if (item && item.id) guestIds.add(item.id);
        });
      }
    });
    if (guestIds.size === 0) return;

    const userKey = `kharchaTrackerData_${userId}`;
    const userRaw = await AsyncStorage.getItem(userKey);
    if (!userRaw) return;
    const userData = JSON.parse(userRaw);
    if (!userData || typeof userData !== 'object') return;

    let changed = false;
    const cleaned = {};
    Object.keys(userData).forEach((monthKey) => {
      const items = Array.isArray(userData[monthKey]) ? userData[monthKey] : [];
      const kept = items.filter((item) => {
        if (item && item.id && guestIds.has(item.id)) {
          changed = true;
          return false;
        }
        return true;
      });
      if (kept.length > 0) {
        cleaned[monthKey] = kept;
      }
    });

    if (changed) {
      await AsyncStorage.setItem(userKey, JSON.stringify(cleaned));
    }
  } catch (_e) {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // Load existing session on launch
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.id) {
            setCurrentUser(parsed);
            purgeGuestItemsFromUser(parsed.id).catch(() => {});
          }
        }
      } catch (_e) {
        // start as guest
      } finally {
        setAuthLoaded(true);
      }
    })();
  }, []);

  // Compute active storage key for Daily Expenses
  const expensesStorageKey = useMemo(() => {
    if (!currentUser || !currentUser.id) {
      return GUEST_EXPENSES_KEY;
    }
    return `kharchaTrackerData_${currentUser.id}`;
  }, [currentUser]);



  // Login with phone number and mandatory name — completely separate from guest
  const loginWithPhone = useCallback(async ({ name, phone, countryCode = '+91' }) => {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const cleanName = name ? name.trim() : '';
    const userId = `${countryCode.replace('+', '')}_${cleanPhone}`;

    // Look up if user profile exists
    const userProfileKey = `@user_profile_${userId}`;
    let profile = null;
    try {
      const rawProfile = await AsyncStorage.getItem(userProfileKey);
      if (rawProfile) profile = JSON.parse(rawProfile);
    } catch (_e) {
      // ignore
    }

    if (!profile) {
      profile = {
        id: userId,
        phone: cleanPhone,
        countryCode,
        name: cleanName || `User ${cleanPhone.slice(-4)}`,
        avatarImage: null,
        createdAt: Date.now(),
      };
    } else if (cleanName) {
      // Update with new name if provided
      profile.name = cleanName;
    }

    await AsyncStorage.setItem(userProfileKey, JSON.stringify(profile));

    // Ensure strict separation: purge any stale merged guest items from this account
    await purgeGuestItemsFromUser(userId);

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    setCurrentUser(profile);
    return profile;
  }, []);

  // Update profile (name, avatarImage, phone)
  const updateProfile = useCallback(async (updates) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      ...updates,
      updatedAt: Date.now(),
    };
    setCurrentUser(updated);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    await AsyncStorage.setItem(`@user_profile_${updated.id}`, JSON.stringify(updated));
    return updated;
  }, [currentUser]);

  // Logout
  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  // Compute active user scope ('guest' or user ID) for separate sync profiles
  const userScope = useMemo(() => {
    return currentUser && currentUser.id ? currentUser.id : 'guest';
  }, [currentUser]);

  const value = useMemo(() => ({
    currentUser,
    isLoggedIn: !!currentUser,
    userScope,
    authLoaded,
    expensesStorageKey,
    loginWithPhone,
    updateProfile,
    logout,
  }), [
    currentUser,
    userScope,
    authLoaded,
    expensesStorageKey,
    loginWithPhone,
    updateProfile,
    logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
