import React, { createContext, useContext } from 'react';
import { useLocationShare } from '../hooks/useLocationShare';

// The location-sharing state lives at the app root (inside AuthProvider) so that
// live sharing keeps running while the user navigates between screens. Mounting
// the hook inside LocationShareScreen would tear it down on every navigation.
const LocationShareContext = createContext(null);

export function LocationShareProvider({ children }) {
  const value = useLocationShare();
  return <LocationShareContext.Provider value={value}>{children}</LocationShareContext.Provider>;
}

export function useLocationShareContext() {
  const ctx = useContext(LocationShareContext);
  if (!ctx) {
    throw new Error('useLocationShareContext must be used within a LocationShareProvider');
  }
  return ctx;
}