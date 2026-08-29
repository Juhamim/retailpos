"use client";

import { useEffect, useState } from "react";

/**
 * Universal hydration hook for Zustand persist stores.
 * Guarantees that components never get stuck and rehydrated state is properly captured.
 */
export function useStoreHydration(store: any): boolean {
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    if (!store?.persist) {
      setHydrated(true);
      return;
    }

    // 1. Check if already hydrated
    if (store.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    // 2. Subscribe to finish hydration event
    const unsub = store.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // 3. Fallback safety timer: guarantee resolution within 150ms
    const timer = setTimeout(() => {
      setHydrated(true);
    }, 150);

    return () => {
      if (typeof unsub === "function") unsub();
      clearTimeout(timer);
    };
  }, [store]);

  return hydrated;
}
