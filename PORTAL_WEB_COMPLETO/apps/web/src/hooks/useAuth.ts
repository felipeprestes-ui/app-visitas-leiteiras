'use client';

import { useState, useEffect, useCallback } from 'react';

export const SESSION_KEY = 'vl_portal_session';

export interface GestorSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function getSession(): GestorSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GestorSession;
  } catch {
    return null;
  }
}

export function setSession(session: GestorSession) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function useAuth() {
  const [session, setSessionState] = useState<GestorSession | null>(null);

  useEffect(() => {
    setSessionState(getSession());
  }, []);

  const login = useCallback((session: GestorSession) => {
    setSession(session);
    setSessionState(session);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  return { session, login, logout };
}
