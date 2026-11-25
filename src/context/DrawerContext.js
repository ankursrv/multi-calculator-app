import { createContext, useContext } from 'react';

/**
 * Lets any screen header open the app-wide side drawer without threading
 * props through every screen. `null` means no drawer is mounted, so
 * ScreenHeader falls back to the classic back arrow.
 */
const DrawerContext = createContext(null);

export function useDrawer() {
  return useContext(DrawerContext);
}

export default DrawerContext;
