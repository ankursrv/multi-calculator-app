// Background location task — runs in a headless JS context, so it cannot read
// React state. Instead it reads the persisted device identity from AsyncStorage
// (written by useLocationShare) and pushes the fix straight to Supabase.
//
// NOTE: `TaskManager.defineTask` MUST run at module load time (global scope),
// not inside a React component — otherwise the task is not registered when the
// app is launched in the background.
import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { upsertLocationShare, ensureFamilyRegistered } from './locationApi';
import { CLOUD_ENABLED } from './supabaseConfig';

export const LOCATION_SHARE_TASK = 'MULTICALC_LOCATION_SHARE';

const STORAGE_KEY_DEVICE_ID = '@location_share_device_id';
const STORAGE_KEY_DEVICE_NAME = '@location_share_device_name';
const STORAGE_KEY_FAMILY_CODE = '@location_share_family_code';

// Keep in sync with useLocationShare.js
const SHARE_TTL_MS = 60 * 60 * 1000;

async function readIdentity() {
  try {
    const [familyCode, deviceId, deviceName] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_FAMILY_CODE),
      AsyncStorage.getItem(STORAGE_KEY_DEVICE_ID),
      AsyncStorage.getItem(STORAGE_KEY_DEVICE_NAME),
    ]);
    return { familyCode, deviceId, deviceName: deviceName || 'My Device' };
  } catch (_e) {
    return { familyCode: null, deviceId: null, deviceName: 'My Device' };
  }
}

async function pushBackgroundFix(coords) {
  if (!CLOUD_ENABLED) return;
  if (!coords || coords.latitude == null || coords.longitude == null) return;

  const { familyCode, deviceId, deviceName } = await readIdentity();
  if (!familyCode || familyCode.length < 8 || !deviceId) return;

  const now = Date.now();
  const share = {
    id: `${familyCode}_${deviceId}`,
    family_code: familyCode,
    device_name: deviceName,
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy != null ? Math.round(coords.accuracy) : null,
    updated_at: now,
    expires_at: now + SHARE_TTL_MS,
  };

  await ensureFamilyRegistered(familyCode);
  await upsertLocationShare(share);
}

// Only the newest fix in a batch is worth pushing — keeps writes minimal.
if (Platform.OS !== 'web') {
  TaskManager.defineTask(LOCATION_SHARE_TASK, async ({ data, error }) => {
    if (error) return;
    try {
      const locations = data && Array.isArray(data.locations) ? data.locations : [];
      if (locations.length === 0) return;
      const latest = locations[locations.length - 1];
      await pushBackgroundFix(latest && latest.coords);
    } catch (_e) {
      // Best effort — foreground watch / heartbeat will still keep sharing alive.
    }
  });
}