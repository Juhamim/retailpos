"use client";

import React, { useState, useRef, useEffect } from "react";
import { PaymentMethod, SaleStatus } from "@retailflow/shared-types";
import { ProductGrid } from "@/components/pos/product-grid";
import { CartPanel } from "@/components/pos/cart-panel";
import { PaymentModal } from "@/components/pos/payment-modal";
import { CustomerSelect } from "@/components/pos/customer-select";
import { HoldSaleDialog } from "@/components/pos/hold-sale-dialog";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import { CameraScanner } from "@/components/pos/camera-scanner";
import { playBeep } from "@/lib/audio";
import { usePOSStore } from "@/stores/pos-store";
import { useProductStore } from "@/stores/product-store";
import { useSalesStore, CompletedSale } from "@/stores/sales-store";
import { useCustomerStore } from "@/stores/customer-store";
import { useShiftStore } from "@/stores/shift-store";
import { useAppStore } from "@/stores/app-store";

import {
  UserPlus,
  Barcode,
  Clock,
  Trash2,
  Play,
  X,
  Search,
  CheckCircle,
  Camera
} from "lucide-react";

export default function POSScreen() {
  const {
    cart,
    customerId,
    customerName,
    orderDiscount,
    heldSales,
    barcodeInput,
    setBarcodeInput,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setCustomer,
    setOrderDiscount,
    holdSale,
    resumeHeldSale,
    deleteHeldSale,
    getTotals,
  } = usePOSStore();

  const products = useProductStore((state) => state.products);
  const deductStockForSale = useProductStore((state) => state.deductStockForSale);
  const recordSale = useSalesStore((state) => state.recordSale);
  const addCustomerOrder = useCustomerStore((state) => state.addCustomerOrder);
  const recordCreditTransaction = useCustomerStore((state) => state.recordCreditTransaction);
  const addSaleToShift = useShiftStore((state) => state.addSaleToShift);
  const currentUser = useAppStore((state) => state.currentUser);
  const activeShift = useShiftStore((state) => state.activeShift);


  const [showPayment, setShowPayment] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [showHeldSalesList, setShowHeldSalesList] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [lastSaleResult, setLastSaleResult] = useState<CompletedSale | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCameraScanSuccess = (barcodeVal: string) => {
    if (!barcodeVal) return;
    const query = barcodeVal.trim();
    const matched = products.find(
      (p) => p.barcode === query || p.sku.toLowerCase() === query.toLowerCase()
    );

    if (matched) {
      if (matched.stockQuantity <= 0) {
        showToast(`Warning: "${matched.name}" is out of stock!`);
      }
      addToCart(matched);
      playBeep();
      showToast(`Scanned & Added: ${matched.name}`);
    } else {
      showToast(`No item found for barcode: "${query}"`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        barcodeRef.current?.focus();
      }
      if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) setShowPayment(true);
      }
      if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) setShowHoldDialog(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    // Search by exact barcode or SKU first
    const matched = products.find(
      (p) => p.barcode === query || p.sku.toLowerCase() === query.toLowerCase()
    );

    if (matched) {
      if (matched.stockQuantity <= 0) {
        showToast(`Warning: "${matched.name}" is out of stock!`);
      }
      addToCart(matched);
      playBeep();
      showToast(`Added: ${matched.name}`);
      setBarcodeInput("");
    } else {
      // Partial name match if unique
      const partialMatches = products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      if (partialMatches.length === 1) {
        addToCart(partialMatches[0]);
        playBeep();
        showToast(`Added: ${partialMatches[0].name}`);
        setBarcodeInput("");
      } else if (partialMatches.length === 0) {
        showToast(`No product found for "${query}"`);
      }
    }
  };

  const totals = getTotals();

  const handleCompleteSale = (payments: { method: PaymentMethod; amount: number; reference?: string }[]) => {
    if (cart.length === 0) return;

    if (!activeShift) {
      showToast("Error: Register Shift is closed. Please open shift first.");
      return;
    }

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const primaryMethod = payments[0]?.method || PaymentMethod.CASH;

    // 1. Deduct stock from inventory
    deductStockForSale(cart.map((item) => ({ productId: item.productId, quantity: item.quantity })));

    // 2. Record sale in persistent store
    const cashierName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin";
    const completed = recordSale({
      invoiceNumber,
      customerId,
      customerName: customerName || "Walk-in Customer",
      items: [...cart],
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: orderDiscount,
      totalAmount: totals.total,
      paymentMethod: primaryMethod,
      payments,
      status: SaleStatus.COMPLETED,
      cashierName,
    });

    // 3. Charge credit to customer if Store Credit used
    const creditPayment = payments.find((p) => p.method === PaymentMethod.CREDIT);
    if (creditPayment && customerId) {
      recordCreditTransaction(
        customerId,
        "charge",
        creditPayment.amount,
        undefined,
        `POS Checkout (Inv: ${invoiceNumber})`
      );
    }

    // 4. Update cashier active shift totals
    addSaleToShift(totals.total, payments);

    // 5. Update customer stats if customer attached
    if (customerId) {
      addCustomerOrder(customerId, totals.total);
    }

    setLastSaleResult(completed);
    setShowPayment(false);
    setShowReceipt(true);
    clearCart();
  };

  return (
    <div className="flex h-[calc(100vh-56px)] bg-gray-50 overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Left Area: Product Search & Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barcode & Search Header */}
        <div className="p-3.5 bg-white border-b flex items-center gap-3 shadow-2xs">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={barcodeRef}
              type="text"
              placeholder="Scan barcode or type SKU / Name & press Enter... (F2)"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
            />
          </form>

          {/* Camera Scanner Trigger Button */}
          <button
            type="button"
            onClick={() => setShowCameraScanner(true)}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shrink-0"
            title="Scan barcode with camera"
          >
            <Camera className="h-4.5 w-4.5 text-gray-500" />
          </button>

          {/* Customer Selection Button */}
          <button
            onClick={() => setShowCustomerSelect(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition-colors shrink-0 text-gray-700"
          >
            <UserPlus className="h-4 w-4 text-blue-600" />
            <span className="max-w-[140px] truncate">{customerName || "Walk-in"}</span>
          </button>

          {/* Held Sales Trigger Button */}
          {heldSales.length > 0 && (
            <button
              onClick={() => setShowHeldSalesList(true)}
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors shrink-0"
            >
              <Clock className="h-3.5 w-3.5" />
              Held ({heldSales.length})
            </button>
          )}
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-auto p-4">
          <ProductGrid
            searchQuery={barcodeInput}
            onAddProduct={(p) => {
              addToCart(p);
              playBeep();
              showToast(`Added: ${p.name}`);
            }}
          />
        </div>
      </div>

      {/* Right Area: Cart & Checkout Panel */}
      <div className="w-[390px] bg-white border-l flex flex-col shadow-lg z-10">
        <CartPanel
          items={cart}
          orderDiscount={orderDiscount}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onSetOrderDiscount={setOrderDiscount}
          subtotal={totals.subtotal}
          taxAmount={totals.taxAmount}
          discountAmount={orderDiscount}
          total={totals.total}
          heldSalesCount={heldSales.length}
          onHoldSale={() => {
            if (cart.length > 0) setShowHoldDialog(true);
            else if (heldSales.length > 0) setShowHeldSalesList(true);
          }}
          onPayment={() => cart.length > 0 && setShowPayment(true)}
        />
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={totals.total}
          onComplete={handleCompleteSale}
          onCancel={() => setShowPayment(false)}
        />
      )}

      {/* Hold Sale Dialog */}
      {showHoldDialog && (
        <HoldSaleDialog
          onHold={(note) => {
            holdSale(note);
            setShowHoldDialog(false);
            showToast("Sale held successfully");
          }}
          onCancel={() => setShowHoldDialog(false)}
        />
      )}

      {/* Held Sales Manager Modal */}
      {showHeldSalesList && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h2 className="font-semibold text-gray-900">Held Sales ({heldSales.length})</h2>
              </div>
              <button
                onClick={() => setShowHeldSalesList(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-auto divide-y divide-gray-100 p-2">
              {heldSales.map((sale) => {
                const totalItems = sale.items.reduce((s, i) => s + i.quantity, 0);
                const totalAmt = sale.items.reduce((s, i) => s + i.totalAmount, 0) - (sale.orderDiscount || 0);

                return (
                  <div key={sale.id} className="p-3.5 hover:bg-gray-50 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                          {sale.customerName || "Walk-in"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(sale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {totalItems} items · ₹{Math.max(0, totalAmt).toFixed(2)}
                      </p>
                      {sale.note && (
                        <p className="text-xs text-amber-700 italic mt-1 bg-amber-50 px-2 py-0.5 rounded inline-block">
                          "{sale.note}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          resumeHeldSale(sale.id);
                          setShowHeldSalesList(false);
                          showToast("Sale resumed");
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" /> Resume
                      </button>
                      <button
                        onClick={() => deleteHeldSale(sale.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSaleResult && (
        <ReceiptDialog
          invoiceNumber={lastSaleResult.invoiceNumber}
          total={lastSaleResult.totalAmount}
          items={lastSaleResult.items}
          customerName={lastSaleResult.customerName}
          paymentMethod={lastSaleResult.paymentMethod}
          onClose={() => {
            setShowReceipt(false);
            setLastSaleResult(null);
          }}
        />
      )}

      {/* Customer Select Modal */}
      {showCustomerSelect && (
        <CustomerSelect
          selectedId={customerId}
          onSelect={(id, name) => {
            setCustomer(id || undefined, name || undefined);
            setShowCustomerSelect(false);
            showToast(`Customer: ${name}`);
          }}
          onClose={() => setShowCustomerSelect(false)}
        />
      )}

      {/* Camera Scanner Modal Overlay */}
      {showCameraScanner && (
        <CameraScanner
          onScanSuccess={handleCameraScanSuccess}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
    </div>
  );
}
