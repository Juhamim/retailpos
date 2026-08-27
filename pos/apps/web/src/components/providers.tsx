"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      let resolved = theme;
      if (theme === "system") {
        resolved = mq.matches ? "dark" : "light";
      }
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };
    applyTheme();
    mq.addEventListener("change", applyTheme);
    return () => mq.removeEventListener("change", applyTheme);
  }, [theme]);

  return <>{children}</>;
}
