"use client";

import React, { useState } from "react";
import { 
  Store, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  Layers, 
  Tag, 
  Receipt 
} from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { useAuthStore } from "@/stores/auth-store";
import { useProductStore } from "@/stores/product-store";
import { GSTRate, ProductStatus, InvoiceFormat } from "@retailflow/shared-types";

interface WizardProps {
  onComplete: () => void;
}

const INDIAN_STATES = [
  "32-Kerala",
  "33-Tamil Nadu",
  "29-Karnataka",
  "36-Telangana",
  "37-Andhra Pradesh",
  "27-Maharashtra",
  "07-Delhi",
  "24-Gujarat",
  "19-West Bengal",
  "09-Uttar Pradesh",
  "08-Rajasthan",
  "06-Haryana",
  "03-Punjab",
  "23-Madhya Pradesh",
  "21-Odisha",
  "10-Bihar",
  "18-Assam",
  "30-Goa",
  "Other / Union Territory",
];

const STARTER_PRESETS = [
  {
    id: "grocery",
    name: "Grocery & Supermarket",
    description: "Rice, Flour, Dairy, Biscuits, Spices & Household FMCG",
    itemsCount: "12 Essentials with HSN",
  },
  {
    id: "electronics",
    name: "Electronics & Mobile",
    description: "Smartphones, Accessories, Cables, Audio & Gadgets",
    itemsCount: "8 Standard SKUs",
  },
  {
    id: "apparel",
    name: "Fashion & Apparel",
    description: "Shirts, T-Shirts, Jeans, Trousers & Footwear",
    itemsCount: "6 Apparel Lines",
  },
  {
    id: "blank",
    name: "Fresh Blank Store",
    description: "Start with an empty catalog and enter your custom items",
    itemsCount: "0 items (Clean)",
  },
];

export function StoreSetupWizard({ onComplete }: WizardProps) {
  const { settings, updateShopSettings, updateTaxSettings, updatePOSSettings } = useSettingsStore();
  const updateOwnerPin = useAuthStore((state) => state.updatePin);
  const addProduct = useProductStore((state) => state.addProduct);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [shopName, setShopName] = useState(settings.shop.shopName || "");
  const [legalName, setLegalName] = useState(settings.shop.legalTradeName || "");
  const [phone, setPhone] = useState(settings.shop.phone || "");
  const [email, setEmail] = useState(settings.shop.email || "");
  const [address, setAddress] = useState(settings.shop.address || "");
  const [gstNumber, setGstNumber] = useState(settings.shop.gstNumber || "");
  const [upiId, setUpiId] = useState(settings.shop.upiId || "");
  const [placeOfSupply, setPlaceOfSupply] = useState("32-Kerala");
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [ownerPin, setOwnerPin] = useState("1234");
  const [selectedPreset, setSelectedPreset] = useState("grocery");

  const handleFinishWizard = () => {
    // 1. Save Shop Settings
    updateShopSettings({
      shopName: shopName.trim() || "RetailFlow Mart",
      legalTradeName: legalName.trim() || undefined,
      phone: phone.trim() || "9876543210",
      email: email.trim() || undefined,
      address: address.trim() || "Main Street, Commercial Market",
      gstNumber: gstNumber.trim() || undefined,
      upiId: upiId.trim() || undefined,
      placeOfSupply,
      currency: "INR",
      currencySymbol,
    });

    // 2. Save Tax & POS Settings
    updateTaxSettings({
      defaultGstRate: GSTRate.FIVE,
      inclusiveTax: false,
      enableHsnSummary: true,
    });

    updatePOSSettings({
      invoiceFormat: InvoiceFormat.A4,
      autoAddBarcode: true,
      holdSaleOnBackspace: false,
      showProductImages: true,
    });

    // 3. Update Admin Owner PIN
    if (ownerPin.length >= 4) {
      updateOwnerPin(ownerPin);
    }

    // 4. Optionally seed preset items if chosen
    if (selectedPreset === "grocery") {
      const groceryStarter = [
        { name: "Basmati Rice 5kg Royal", sku: "RIC-501", hsnCode: "1006", category: "Grocery & Staples", mrp: 450, cost: 350, price: 420, gst: GSTRate.ZERO, unit: "bag", stock: 40 },
        { name: "Atta Whole Wheat 10kg", sku: "ATT-101", hsnCode: "1101", category: "Grocery & Staples", mrp: 380, cost: 310, price: 360, gst: GSTRate.ZERO, unit: "bag", stock: 35 },
        { name: "Amul Butter 500g", sku: "BUT-500", hsnCode: "0401", category: "Dairy & Bakery", mrp: 280, cost: 245, price: 275, gst: GSTRate.TWELVE, unit: "pack", stock: 25 },
        { name: "Sunflower Oil 1L Pouch", sku: "OIL-100", hsnCode: "1512", category: "Grocery & Staples", mrp: 160, cost: 130, price: 150, gst: GSTRate.FIVE, unit: "pouch", stock: 50 },
        { name: "Toor Dal Premium 1kg", sku: "DAL-101", hsnCode: "0713", category: "Grocery & Staples", mrp: 180, cost: 140, price: 170, gst: GSTRate.ZERO, unit: "kg", stock: 60 },
        { name: "Parle-G Gold Biscuits 1kg", sku: "BIS-100", hsnCode: "1905", category: "Snacks & Namkeen", mrp: 120, cost: 95, price: 110, gst: GSTRate.EIGHTEEN, unit: "pack", stock: 45 },
      ];
      for (const item of groceryStarter) {
        addProduct({
          name: item.name,
          sku: item.sku,
          barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          hsnCode: item.hsnCode,
          mrp: item.mrp,
          categoryId: "cat-grocery",
          categoryName: item.category,
          purchasePrice: item.cost,
          sellingPrice: item.price,
          gstRate: item.gst,
          discountPercent: 0,
          stockQuantity: item.stock,
          reorderLevel: 10,
          unit: item.unit,
          status: ProductStatus.ACTIVE,
          isWeighable: false,
        });
      }
    }

    // Mark wizard as completed in local storage
    localStorage.setItem("rf_setup_completed", "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[95vh]">
        {/* Top Wizard Step Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                R
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight">RetailFlow Store Onboarding</h1>
                <p className="text-xs text-slate-500">First-time production setup wizard</p>
              </div>
            </div>

            {/* Step Badges */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step === s
                      ? "bg-blue-600 text-white shadow-xs"
                      : step > s
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step > s ? "✓" : s}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Wizard Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: Store & Legal Details */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-600" /> 1. Store Identity & Contact Details
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Enter your shop trade name, address, and phone number for invoice branding</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Store / Shop Display Name *</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Royal Supermarket & Department Store"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Legal Company / Trade Name</label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="e.g. Royal Retail Enterprises Pvt Ltd"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Primary Contact Phone *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Store Physical Address *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Ground Floor, City Centre Complex, MG Road"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GST & Cashless UPI Details */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600" /> 2. GST Tax & Dynamic UPI Payment QR
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Configure statutory GSTIN and shop UPI ID for automatic dynamic payment QR codes</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Store GSTIN (15-Digit Tax ID)</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 32AABCU9603R1ZM"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">State / Place of Supply *</label>
                  <select
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Shop Merchant UPI ID (For Instant Dynamic QR)</span>
                    <span className="text-[10px] text-blue-600 font-semibold">Google Pay / PhonePe / Paytm</span>
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. retailmart@okaxis or 9876543210@paytm"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    A dynamic QR code with the exact order total will automatically generate on POS screen and printed invoices.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Security & Owner PIN */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" /> 3. Store Owner Master Security PIN
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Set a 4-digit Master PIN to protect managerial reports, discounts, and store settings</p>
              </div>

              <div className="max-w-xs mx-auto text-center space-y-3 pt-4">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                  Enter 4-Digit Owner PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={ownerPin}
                  onChange={(e) => setOwnerPin(e.target.value)}
                  placeholder="1234"
                  className="w-48 h-12 mx-auto text-center text-2xl font-black tracking-widest rounded-2xl border-2 border-blue-500 bg-blue-50/30 text-slate-900 focus:outline-none font-mono"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500">
                  Default: <span className="font-mono font-bold text-slate-700">1234</span>. Used to unlock admin dashboard, staff management, and day-end reports.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Starter Catalog Preset */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" /> 4. Starter Product Catalog
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Select a pre-loaded catalog template with HSN codes or start with a clean database</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {STARTER_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all space-y-1.5 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{preset.name}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{preset.description}</p>
                      <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        {preset.itemsCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              Next Step <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishWizard}
              className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Launch Production Store
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
