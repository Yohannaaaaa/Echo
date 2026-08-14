'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type IdentityUser = {
  id: string;
  city: string | null;
  countryCode: string | null;
  recoveryCode: string;
  email: string | null;
  pseudo: string | null;
};

type AuthResult = { ok: true } | { ok: false; error: string };

type Ctx = {
  user: IdentityUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setCity: (city: string) => Promise<void>;
  cityPickerOpen: boolean;
  openCityPicker: () => void;
  closeCityPicker: () => void;
  identityModalOpen: boolean;
  openIdentityModal: () => void;
  closeIdentityModal: () => void;
  restore: (code: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  setPseudo: (pseudo: string) => Promise<AuthResult>;
};

const IdentityContext = createContext<Ctx | null>(null);

async function postJson(url: string, body: unknown): Promise<{ res: Response; data: any }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IdentityUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/me');
    const data = await res.json();
    setUser(data.user);
    setLoading(false);
  }, []);

  const setCity = useCallback(async (city: string) => {
    const { data } = await postJson('/api/me/city', { city });
    if (data.user) setUser(data.user);
    setCityPickerOpen(false);
  }, []);

  const restore = useCallback(async (code: string) => {
    const { res, data } = await postJson('/api/me/restore', { code });
    if (res.ok && data.user) {
      setUser(data.user);
      return true;
    }
    return false;
  }, []);

  const signup = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { res, data } = await postJson('/api/auth/signup', { email, password });
    if (res.ok && data.user) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error ?? 'Erreur inconnue.' };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { res, data } = await postJson('/api/auth/login', { email, password });
    if (res.ok && data.user) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error ?? 'Erreur inconnue.' };
  }, []);

  const setPseudo = useCallback(async (pseudo: string): Promise<AuthResult> => {
    const { res, data } = await postJson('/api/me/pseudo', { pseudo });
    if (res.ok && data.user) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error ?? 'Erreur inconnue.' };
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
        identityModalOpen,
        openIdentityModal: () => setIdentityModalOpen(true),
        closeIdentityModal: () => setIdentityModalOpen(false),
        restore,
        signup,
        login,
        setPseudo,
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
