"use client";

import React, { useState, useEffect } from "react";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";

export default function LoginPage() {
  const { verifyPin, verifyPassword } = useAuthStore();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const setIsLocked = useAppStore((state) => state.setIsLocked);

  const [mode, setMode] = useState<"credentials" | "pin">("pin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    const authenticatedUser = verifyPassword(username, password);
    if (authenticatedUser) {
      setCurrentUser(authenticatedUser);
      setIsLocked(false);
      window.location.href = "/dashboard";
    } else {
      setError("Invalid username or password");
    }
  };

  const handlePinKey = (val: string) => {
    setError("");
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        const authenticatedUser = verifyPin(newPin);
        if (authenticatedUser) {
          setCurrentUser(authenticatedUser);
          setIsLocked(false);
          window.location.href = "/dashboard";
        } else {
          setError("Incorrect PIN");
          setPin(""); // reset
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  useEffect(() => {
    if (mode !== "pin") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key >= "0" && e.key <= "9") {
        handlePinKey(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        setPin("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, pin]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
            <span className="text-white text-3xl font-extrabold tracking-tight">R</span>
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            RetailFlow POS
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            Enterprise Point of Sale
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex bg-slate-800 p-1.5 rounded-xl border border-slate-700/50 mb-4 shadow-inner">
          <button
            onClick={() => { setMode("pin"); setError(""); setPin(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === "pin" ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" : "text-slate-400 hover:text-white"
            }`}
          >
            Quick PIN Lock
          </button>
          <button
            onClick={() => { setMode("credentials"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === "credentials" ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" : "text-slate-400 hover:text-white"
            }`}
          >
            Password Sign In
          </button>
        </div>

        {/* Content Box */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl">
          {error && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-200 text-xs px-3.5 py-2.5 rounded-xl mb-4 text-center">
              {error}
            </div>
          )}

          {mode === "credentials" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    placeholder="Enter username"
                    className="w-full h-11 pl-11 pr-4 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter password"
                    className="w-full h-11 pl-11 pr-11 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-blue-600/10"
              >
                Access POS Dashboard
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* PIN display dots */}
              <div className="flex justify-center gap-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 border-slate-600 transition-all ${
                      pin.length > idx ? "bg-blue-500 border-blue-500 scale-110 shadow-lg shadow-blue-500/50" : "bg-transparent"
                    }`}
                  />
                ))}
              </div>

              {/* Pin Keypad Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((val) => (
                  <button
                    key={val}
                    onClick={() => handlePinKey(val)}
                    className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-lg font-bold flex items-center justify-center border border-slate-800/80 active:scale-95 transition-all"
                  >
                    {val}
                  </button>
                ))}
                <button
                  onClick={() => setPin("")}
                  className="w-16 h-16 rounded-full text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  onClick={() => handlePinKey("0")}
                  className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-lg font-bold flex items-center justify-center border border-slate-800/80 active:scale-95 transition-all"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="w-16 h-16 rounded-full text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center justify-center"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="mt-6 border-t border-slate-700/30 pt-4 text-center">
            <p className="text-[10px] text-slate-500 tracking-wide uppercase">
              Pre-seeded Accounts: Admin PIN: 1234 | Cashier PIN: 5678 | Manager PIN: 9999
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6 tracking-wider font-semibold uppercase">
          RetailFlow POS Enterprise v1.0.0
        </p>
      </div>
    </div>
  );
}
