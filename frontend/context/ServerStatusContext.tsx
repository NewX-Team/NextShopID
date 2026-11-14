"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin.service";

interface ServerStatusContextType {
  isServerActive: boolean;
  setIsServerActive: (active: boolean) => void;
  refreshServerStatus: () => Promise<void>;
}

const ServerStatusContext = createContext<ServerStatusContextType | undefined>(undefined);

export const ServerStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isServerActive, setIsServerActiveState] = useState<boolean>(true);

  const refreshServerStatus = useCallback(async () => {
    try {
      const res = await adminService.getPublicServerStatus();
      if (res.success && typeof res.serverActive === "boolean") {
        setIsServerActiveState(res.serverActive);
      }
    } catch {
      // Jika terjadi error koneksi, biarkan default true agar tidak false positive
    }
  }, []);

  const setIsServerActive = useCallback((active: boolean) => {
    setIsServerActiveState(active);
  }, []);

  // Polling status server secara berkala (setiap 5 detik) agar seluruh browser tab tersinkronisasi
  useEffect(() => {
    refreshServerStatus();

    const interval = setInterval(() => {
      refreshServerStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshServerStatus]);

  return (
    <ServerStatusContext.Provider
      value={{
        isServerActive,
        setIsServerActive,
        refreshServerStatus,
      }}
    >
      {children}
    </ServerStatusContext.Provider>
  );
};

export const useServerStatus = (): ServerStatusContextType => {
  const context = useContext(ServerStatusContext);
  if (!context) {
    throw new Error("useServerStatus must be used within a ServerStatusProvider");
  }
  return context;
};
