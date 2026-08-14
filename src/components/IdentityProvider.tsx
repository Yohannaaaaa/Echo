'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type IdentityUser = {
  id: string;
  city: string | null;
  countryCode: string | null;
};

type Ctx = {
  user: IdentityUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setCity: (city: string) => Promise<void>;
  cityPickerOpen: boolean;
  openCityPicker: () => void;
  closeCityPicker: () => void;
};

const IdentityContext = createContext<Ctx | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IdentityUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/me');
    const data = await res.json();
    setUser(data.user);
    setLoading(false);
  }, []);

  const setCity = useCallback(async (city: string) => {
    const res = await fetch('/api/me/city', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city }),
    });
    const data = await res.json();
    if (data.user) setUser(data.user);
    setCityPickerOpen(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <IdentityContext.Provider
      value={{
        user,
        loading,
        refresh,
        setCity,
        cityPickerOpen,
        openCityPicker: () => setCityPickerOpen(true),
        closeCityPicker: () => setCityPickerOpen(false),
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used within IdentityProvider');
  return ctx;
}
