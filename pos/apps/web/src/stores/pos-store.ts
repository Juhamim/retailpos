import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "@/lib/tauri-storage";
import type { CartItem, ProductWithCategory } from "@retailflow/shared-types";
import { PaymentMethod, SaleStatus } from "@retailflow/shared-types";
import { usePromoStore } from "./promo-store";
import { useProductStore } from "./product-store";

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

export interface RetailCartItem extends CartItem {
  originalUnitPrice?: number;
  originalDiscountPercent?: number;
  isPromoFreeItem?: boolean;
}

function calculateItemTotals(item: RetailCartItem): RetailCartItem {
  const itemTotalInclusive = item.unitPrice * item.quantity;
  const lineDiscount = itemTotalInclusive * (item.discountPercent / 100);
  const totalAmount = itemTotalInclusive - lineDiscount;
  
  const subtotal = totalAmount / (1 + item.taxRate / 100);
  const taxAmount = totalAmount - subtotal;
  
  return {
    ...item,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

function applyPromoRules(cart: RetailCartItem[]): RetailCartItem[] {
  const rules = usePromoStore.getState().rules.filter((r) => r.status === "active");
  const products = useProductStore.getState().products;

  // Clone and restore original values, filter out old promo items
  let updated: RetailCartItem[] = cart
    .filter((item) => !item.isPromoFreeItem)
    .map((item) => ({
      ...item,
      unitPrice: item.originalUnitPrice ?? item.unitPrice,
      originalUnitPrice: item.originalUnitPrice ?? item.unitPrice,
      discountPercent: item.originalDiscountPercent ?? item.discountPercent,
      originalDiscountPercent: item.originalDiscountPercent ?? item.discountPercent,
    }));

  for (const rule of rules) {
    if (rule.type === "volume_discount") {
      const targetId = rule.conditions.buyProductId;
      const minQty = rule.conditions.minQty || 1;
      const volPrice = rule.actions.volumePrice || 0;

      updated = updated.map((item) => {
        if (item.productId === targetId && item.quantity >= minQty) {
          return { ...item, unitPrice: volPrice };
        }
        return item;
      });
    }

    if (rule.type === "category_discount") {
      const catId = rule.conditions.categoryId;
      const disc = rule.actions.discountPercent || 0;

      updated = updated.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod && prod.categoryId === catId) {
          return { ...item, discountPercent: Math.min(100, item.discountPercent + disc) };
        }
        return item;
      });
    }

    if (rule.type === "bogo") {
      const buyId = rule.conditions.buyProductId;
      const buyQty = rule.conditions.buyQty || 1;
      const freeId = rule.actions.freeProductId;
      const freeQty = rule.actions.freeQty || 1;

      const itemToBuy = updated.find((item) => item.productId === buyId);
      if (itemToBuy && itemToBuy.quantity >= buyQty) {
        const setsOfPromo = Math.floor(itemToBuy.quantity / buyQty);
        const totalFreeQty = setsOfPromo * freeQty;

        const freeProduct = products.find((p) => p.id === freeId);
        if (freeProduct) {
          updated.push({
            productId: `${freeProduct.id}-free`,
            productName: `${freeProduct.name} (BOGO Free)`,
            productSku: freeProduct.sku,
            barcode: freeProduct.barcode,
            quantity: totalFreeQty,
            unitPrice: 0,
            purchasePrice: 0,
            discountPercent: 0,
            taxRate: parseFloat(freeProduct.gstRate) || 0,
            taxAmount: 0,
            totalAmount: 0,
            isPromoFreeItem: true,
          });
        }
      }
    }
  }

  return updated.map((item) => calculateItemTotals(item));
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
          set({ cart: applyPromoRules(updated) });
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
          set({ cart: applyPromoRules([...state.cart, newItem]) });
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          cart: applyPromoRules(
            state.cart.map((item) =>
              item.productId === productId
                ? calculateItemTotals({ ...item, quantity })
                : item
            )
          ),
        }));
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: applyPromoRules(state.cart.filter((i) => i.productId !== productId)),
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
        const totalInclusive = cart.reduce((sum, item) => sum + item.totalAmount, 0);
        const taxAmount = cart.reduce((sum, item) => sum + item.taxAmount, 0);
        const total = Math.max(0, totalInclusive - orderDiscount);
        const subtotal = totalInclusive - taxAmount;

        return {
          subtotal: Math.round(subtotal * 100) / 100,
          taxAmount: Math.round(taxAmount * 100) / 100,
          total: Math.round(total * 100) / 100,
          itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
        };
      },
    }),
    {
      name: "retailflow-pos-cart-storage",
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
