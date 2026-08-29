import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";

export interface GiftCard {
  id: string;
  cardCode: string;
  initialBalance: number;
  currentBalance: number;
  customerId?: string;
  customerName?: string;
  status: "active" | "exhausted" | "expired";
  createdAt: string;
  expiryDate: string;
}

interface GiftCardState {
  giftCards: GiftCard[];
  issueGiftCard: (card: Omit<GiftCard, "id" | "currentBalance" | "status" | "createdAt">) => GiftCard;
  deductGiftCard: (cardCode: string, amount: number) => { success: boolean; error?: string };
}

export const useGiftCardStore = create<GiftCardState>()(
  persist(
    (set, get) => ({
      giftCards: [],

      issueGiftCard: (cardData) => {
        const id = `gc-${Date.now()}`;
        const newCard: GiftCard = {
          ...cardData,
          id,
          currentBalance: cardData.initialBalance,
          status: "active",
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          giftCards: [newCard, ...state.giftCards],
        }));

        return newCard;
      },

      deductGiftCard: (cardCode, amount) => {
        const { giftCards } = get();
        const card = giftCards.find((c) => c.cardCode === cardCode);
        if (!card) {
          return { success: false, error: "Gift card not found" };
        }
        if (card.status !== "active") {
          return { success: false, error: `Gift card is ${card.status}` };
        }
        if (new Date(card.expiryDate).getTime() < Date.now()) {
          set((state) => ({
            giftCards: state.giftCards.map((c) =>
              c.cardCode === cardCode ? { ...c, status: "expired" } : c
            ),
          }));
          return { success: false, error: "Gift card has expired" };
        }
        if (card.currentBalance < amount) {
          return { success: false, error: `Insufficient balance (Available: ₹${card.currentBalance})` };
        }

        const newBalance = card.currentBalance - amount;
        set((state) => ({
          giftCards: state.giftCards.map((c) =>
            c.cardCode === cardCode
              ? {
                  ...c,
                  currentBalance: newBalance,
                  status: newBalance <= 0 ? "exhausted" : "active",
                }
              : c
          ),
        }));

        return { success: true };
      },
    }),
    {
      name: "retailflow-giftcards-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
