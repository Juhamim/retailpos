import React, { useState, useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { Lock, LogOut } from "lucide-react";

export function PinLockScreen() {
  const isLocked = useAppStore((state) => state.isLocked);
  const setIsLocked = useAppStore((state) => state.setIsLocked);
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  
  const { verifyPin, users } = useAuthStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [selectedSwitchUser, setSelectedSwitchUser] = useState<any>(null);

  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handlePinKey(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        setPin("");
        setSelectedSwitchUser(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, pin, selectedSwitchUser]);

  if (!isLocked) return null;

  const handlePinKey = (val: string) => {
    setError("");
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        if (selectedSwitchUser) {
          if (selectedSwitchUser.pin === newPin) {
            setCurrentUser(selectedSwitchUser);
            setIsLocked(false);
            setPin("");
            setSelectedSwitchUser(null);
          } else {
            setError(`Invalid PIN code for ${selectedSwitchUser.firstName}`);
            setPin("");
          }
        } else {
          const authenticatedUser = verifyPin(newPin);
          if (authenticatedUser) {
            setCurrentUser(authenticatedUser);
            setIsLocked(false);
            setPin("");
          } else {
            setError("Invalid PIN code");
            setPin("");
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLocked(false);
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-50 p-4 font-sans text-white">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-blue-500 animate-pulse" />
        </div>

        <h2 className="text-lg font-black tracking-tight text-white mb-0.5">Register Locked</h2>
        {selectedSwitchUser ? (
          <p className="text-xs text-slate-400 mb-6">
            Switching to: <strong className="text-blue-400 font-bold">{selectedSwitchUser.firstName} {selectedSwitchUser.lastName}</strong>
            <button type="button" onClick={() => setSelectedSwitchUser(null)} className="ml-2 text-[10px] text-rose-400 hover:text-rose-300 font-bold underline">Cancel</button>
          </p>
        ) : (
          <p className="text-xs text-slate-400 mb-6">
            Currently active: <strong className="text-slate-200">{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "No User"}</strong>
          </p>
        )}

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-200 text-xs px-3.5 py-1.5 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        {/* PIN display dots */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4.5 h-4.5 rounded-full border-2 border-slate-700 transition-all ${
                pin.length > idx ? "bg-blue-500 border-blue-500 scale-110 shadow-lg shadow-blue-500/40" : "bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3.5 mb-6 max-w-[280px]">
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

        {/* Quick Swapper */}
        <div className="w-full border-t border-slate-800 pt-5 text-center flex flex-col items-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">Quick Switch Cashier</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setPin("");
                  setError("");
                  setSelectedSwitchUser(user);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  (selectedSwitchUser ? selectedSwitchUser.id === user.id : currentUser?.id === user.id)
                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/25"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                }`}
                title={`Switch to ${user.username}`}
              >
                {user.firstName} ({user.role.toUpperCase()})
              </button>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold tracking-tight bg-red-950/20 px-4 py-2 rounded-xl border border-red-500/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Full Exit / Logout
          </button>
        </div>
      </div>
    </div>
  );
}
