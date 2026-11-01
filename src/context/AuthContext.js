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

  // Check if guest has existing expenses that can be merged
  const checkHasGuestExpenses = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(GUEST_EXPENSES_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;
      return Object.values(data).some((arr) => Array.isArray(arr) && arr.length > 0);
    } catch (_e) {
      return false;
    }
  }, []);

  // Migrate / Merge guest data into the user's storage
  const mergeGuestDataIntoUser = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const guestRaw = await AsyncStorage.getItem(GUEST_EXPENSES_KEY);
      if (!guestRaw) return;
      const guestData = JSON.parse(guestRaw);
      if (!guestData || typeof guestData !== 'object') return;

      const userKey = `kharchaTrackerData_${userId}`;
      const userRaw = await AsyncStorage.getItem(userKey);
      const userData = userRaw ? JSON.parse(userRaw) : {};

      // Merge each month list, deduplicating by ID
      const merged = { ...userData };
      Object.keys(guestData).forEach((monthKey) => {
        const guestItems = Array.isArray(guestData[monthKey]) ? guestData[monthKey] : [];
        const existingItems = Array.isArray(merged[monthKey]) ? merged[monthKey] : [];
        const existingIds = new Set(existingItems.map((item) => item.id));
        const additions = guestItems.filter((item) => !existingIds.has(item.id));
        merged[monthKey] = [...existingItems, ...additions];
      });

      await AsyncStorage.setItem(userKey, JSON.stringify(merged));
    } catch (_e) {
      // ignore
    }
  }, []);

  // Login with phone number and mandatory name
  const loginWithPhone = useCallback(async ({ name, phone, countryCode = '+91', mergeGuest = false }) => {
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

    if (mergeGuest) {
      await mergeGuestDataIntoUser(userId);
    }

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    setCurrentUser(profile);
    return profile;
  }, [mergeGuestDataIntoUser]);

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

  const value = useMemo(() => ({
    currentUser,
    isLoggedIn: !!currentUser,
    authLoaded,
    expensesStorageKey,
    loginWithPhone,
    updateProfile,
    logout,
    checkHasGuestExpenses,
    mergeGuestDataIntoUser,
  }), [
    currentUser,
    authLoaded,
    expensesStorageKey,
    loginWithPhone,
    updateProfile,
    logout,
    checkHasGuestExpenses,
    mergeGuestDataIntoUser,
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
