"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading RetailFlow POS...</p>
      </div>
    </div>
  );
}
