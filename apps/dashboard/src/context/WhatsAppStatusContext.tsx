'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api-client';

interface WhatsAppStatusData {
  status: string;
  phoneNumber: string | null;
  platform: string | null;
  qrCode: string | null;
  adapterMode: string;
}

interface WhatsAppStatusContextType {
  data: WhatsAppStatusData;
  isConnected: boolean;
  phoneNumber: string | null;
  qrCode: string | null;
  loading: boolean;
  pairing: boolean;
  loggingOut: boolean;
  refresh: () => Promise<void>;
  startPairing: (visual?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const defaultStatus: WhatsAppStatusData = {
  status: 'DISCONNECTED',
  phoneNumber: null,
  platform: null,
  qrCode: null,
  adapterMode: 'baileys',
};

const WhatsAppStatusContext = createContext<WhatsAppStatusContextType>({
  data: defaultStatus,
  isConnected: false,
  phoneNumber: null,
  qrCode: null,
  loading: true,
  pairing: false,
  loggingOut: false,
  refresh: async () => {},
  startPairing: async () => {},
  logout: async () => {},
});

export function WhatsAppStatusProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WhatsAppStatusData>(defaultStatus);
  const [loading, setLoading] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const updateStatus = useCallback((newData: Partial<WhatsAppStatusData>) => {
    setData((prev) => {
      const merged = { ...prev, ...newData };
      if (merged.phoneNumber && merged.status === 'CONNECTED') {
        merged.qrCode = null;
      }
      return merged;
    });
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.getWhatsAppStatus();
      if (res?.success && res.data) {
        updateStatus(res.data);
        if (res.data.status === 'CONNECTED' || res.data.phoneNumber) {
          setPairing(false);
        }
      }
    } catch (e) {
      console.warn('[WhatsAppContext] Status fetch error:', e);
    }
  }, [updateStatus]);

  useEffect(() => {
    fetchStatus();

    // Single global SSE connection for instant state broadcasts across all tabs
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    let es: EventSource | null = null;

    try {
      es = new EventSource(`${apiBase}/api/v1/admin/events`);
      es.addEventListener('whatsapp_status', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          updateStatus({
            status: payload.status,
            phoneNumber: payload.phoneNumber,
            qrCode: payload.status === 'CONNECTED' ? null : payload.qrCode,
            platform: payload.platform,
          });
          if (payload.status === 'CONNECTED') {
            setPairing(false);
          }
        } catch {
          // ignore
        }
      });
    } catch (err) {
      console.warn('[WhatsAppContext] SSE unavailable:', err);
    }

    const interval = setInterval(fetchStatus, 2000);

    return () => {
      if (es) es.close();
      clearInterval(interval);
    };
  }, [fetchStatus, updateStatus]);

  const handleStartPairing = async (visual: boolean = true) => {
    setPairing(true);
    try {
      await api.startPairing(visual);
      await fetchStatus();
    } catch (e) {
      alert('Failed to launch WhatsApp Web pairing window');
      setPairing(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to disconnect and logout the current WhatsApp session?')) {
      return;
    }
    setLoggingOut(true);
    try {
      setData(defaultStatus);
      await api.logoutWhatsApp();
      await fetchStatus();
    } catch (e) {
      alert('Failed to logout');
    } finally {
      setLoggingOut(false);
    }
  };

  const isConnected = data.status === 'CONNECTED' && Boolean(data.phoneNumber);

  return (
    <WhatsAppStatusContext.Provider
      value={{
        data,
        isConnected,
        phoneNumber: data.phoneNumber,
        qrCode: isConnected ? null : data.qrCode,
        loading,
        pairing,
        loggingOut,
        refresh: fetchStatus,
        startPairing: handleStartPairing,
        logout: handleLogout,
      }}
    >
      {children}
    </WhatsAppStatusContext.Provider>
  );
}

export function useWhatsAppStatus() {
  return useContext(WhatsAppStatusContext);
}
