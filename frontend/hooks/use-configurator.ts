import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConfiguratorState {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  
  sidebarType: 'default' | 'mini';
  setSidebarType: (t: 'default' | 'mini') => void;

  contrastMode: 'filled' | 'transparent';
  setContrastMode: (m: 'filled' | 'transparent') => void;

  primaryColor: string;
  setPrimaryColor: (c: string) => void;
  
  resetConfig: () => void;
}

export const useConfigurator = create<ConfiguratorState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      
      sidebarType: 'default',
      setSidebarType: (t) => set({ sidebarType: t }),

      contrastMode: 'filled',
      setContrastMode: (m) => set({ contrastMode: m }),

      primaryColor: '#4318FF', // Default Horizon Purple
      setPrimaryColor: (c) => set({ primaryColor: c }),

      resetConfig: () => set({
        sidebarType: 'default',
        contrastMode: 'filled',
        primaryColor: '#4318FF'
      })
    }),
    {
      name: 'invoicecore-config', // LocalStorage key
    }
  )
);