import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/app-store";

export function useKeyboardShortcuts() {
  const router = useRouter();
  const setIsLocked = useAppStore((state) => state.setIsLocked);
  const commandPaletteOpen = useAppStore((state) => state.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((state) => state.setCommandPaletteOpen);
  const currentUser = useAppStore((state) => state.currentUser);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Lock Screen shortcut (Ctrl+L)
      if (e.ctrlKey && e.key.toLowerCase() === "l") {
        if (currentUser) {
          e.preventDefault();
          setIsLocked(true);
        }
      }

      // 2. Command Palette shortcut (Ctrl+K)
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }

      // 3. F-Key Navigation
      if (e.key === "F9") {
        e.preventDefault();
        router.push("/shifts");
      }
      if (e.key === "F10") {
        e.preventDefault();
        router.push("/reports");
      }

      // Help menu (F1)
      if (e.key === "F1") {
        e.preventDefault();
        alert(
          "RetailFlow POS Global Shortcuts:\n\n" +
          "F1 - Display Help Menu\n" +
          "F2 - Focus Barcode Scanning Input\n" +
          "F3 - Search / Select Customer Profile\n" +
          "F4 - Put Current Sale on Hold\n" +
          "F5 - Resume Last Held Sale\n" +
          "F6 - Apply Order Level Discount\n" +
          "F7 - Clear POS Cart / Start New Sale\n" +
          "F8 - Proceed to Checkout & Pay\n" +
          "F9 - Open Shifts / Register Reconciliation\n" +
          "F10 - Open Reports & Analytics Page\n" +
          "Ctrl+K - Search Actions & Products (Command Palette)\n" +
          "Ctrl+L - Quick Lock Cash Register Screen"
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, setIsLocked, commandPaletteOpen, setCommandPaletteOpen, currentUser]);
}
