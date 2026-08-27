import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, ProductWithCategory } from "@retailflow/shared-types";
import { PaymentMethod, SaleStatus } from "@retailflow/shared-types";

export interface HeldSaleRecord {
  id: string;
  items: CartItem[];
  customerId?: string;
  customerName?: string;
  orderDiscount: number;
  note?: string;
  createdAt: string;
}

export interface POSStoreState {
  cart: CartItem[];
  customerId?: string;
  customerName?: string;
  orderDiscount: number;
  heldSales: HeldSaleRecord[];
  barcodeInput: string;

  setBarcodeInput: (input: string) => void;
  addToCart: (product: ProductWithCategory) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setCustomer: (id?: string, name?: string) => void;
  setOrderDiscount: (discount: number) => void;
  holdSale: (note?: string) => void;
  resumeHeldSale: (heldId: string) => void;
  deleteHeldSale: (heldId: string) => void;
  getTotals: () => {
    subtotal: number;
    taxAmount: number;
    total: number;
    itemCount: number;
  };
}

function calculateItemTotals(item: CartItem): CartItem {
  const itemTotal = item.unitPrice * item.quantity;
  const lineDiscount = itemTotal * (item.discountPercent / 100);
  const afterDiscount = itemTotal - lineDiscount;
  const taxAmount = afterDiscount * (item.taxRate / 100);
  return {
    ...item,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round((afterDiscount + taxAmount) * 100) / 100,
  };
}

export const usePOSStore = create<POSStoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      customerId: undefined,
      customerName: undefined,
      orderDiscount: 0,
      heldSales: [],
      barcodeInput: "",

      setBarcodeInput: (barcodeInput) => set({ barcodeInput }),

      addToCart: (product) => {
        const state = get();
        const existing = state.cart.find((i) => i.productId === product.id);
        const taxRate = parseFloat(product.gstRate) || 0;

        if (existing) {
          const updated = state.cart.map((i) =>
            i.productId === product.id
              ? calculateItemTotals({ ...i, quantity: i.quantity + 1 })
              : i
          );
          set({ cart: updated });
        } else {
          const newItem: CartItem = calculateItemTotals({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            barcode: product.barcode,
            quantity: 1,
            unitPrice: product.sellingPrice,
            purchasePrice: product.purchasePrice,
            discountPercent: product.discountPercent || 0,
            taxRate,
            taxAmount: 0,
            totalAmount: 0,
          });
          set({ cart: [...state.cart, newItem] });
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          cart: state.cart.map((item) =>
            item.productId === productId
              ? calculateItemTotals({ ...item, quantity })
              : item
          ),
        }));
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((i) => i.productId !== productId),
        }));
      },

      clearCart: () => {
        set({
          cart: [],
          customerId: undefined,
          customerName: undefined,
          orderDiscount: 0,
          barcodeInput: "",
        });
      },

      setCustomer: (id, name) => {
        set({ customerId: id, customerName: name });
      },

      setOrderDiscount: (discount) => {
        set({ orderDiscount: Math.max(0, discount) });
      },

      holdSale: (note) => {
        const state = get();
        if (state.cart.length === 0) return;

        const held: HeldSaleRecord = {
          id: `held-${Date.now()}`,
          items: [...state.cart],
          customerId: state.customerId,
          customerName: state.customerName,
          orderDiscount: state.orderDiscount,
          note,
          createdAt: new Date().toISOString(),
        };

        set({
          heldSales: [held, ...state.heldSales],
        });
        get().clearCart();
      },

      resumeHeldSale: (heldId) => {
        const state = get();
        const held = state.heldSales.find((h) => h.id === heldId);
        if (!held) return;

        set({
          cart: held.items,
          customerId: held.customerId,
          customerName: held.customerName,
          orderDiscount: held.orderDiscount,
          heldSales: state.heldSales.filter((h) => h.id !== heldId),
        });
      },

      deleteHeldSale: (heldId) => {
        set((state) => ({
          heldSales: state.heldSales.filter((h) => h.id !== heldId),
        }));
      },

      getTotals: () => {
        const { cart, orderDiscount } = get();
        const subtotal = cart.reduce((sum, item) => {
          const itemTotal = item.unitPrice * item.quantity;
          const discount = itemTotal * (item.discountPercent / 100);
          return sum + (itemTotal - discount);
        }, 0);

        const taxAmount = cart.reduce((sum, item) => sum + item.taxAmount, 0);
        const total = Math.max(0, subtotal + taxAmount - orderDiscount);
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

        return {
          subtotal: Math.round(subtotal * 100) / 100,
          taxAmount: Math.round(taxAmount * 100) / 100,
          total: Math.round(total * 100) / 100,
          itemCount,
        };
      },
    }),
    {
      name: "retailflow-pos-cart-storage",
    }
  )
);
