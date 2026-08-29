import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAppStore } from "@/stores/app-store";
import { useProductStore } from "@/stores/product-store";
import { usePOSStore } from "@/stores/pos-store";
import { useRouter } from "next/navigation";
import { Search, FileText, Package, CornerDownLeft, X } from "lucide-react";

export function CommandPalette() {
  const router = useRouter();
  const isOpen = useAppStore((state) => state.commandPaletteOpen);
  const setIsOpen = useAppStore((state) => state.setCommandPaletteOpen);
  
  const products = useProductStore((state) => state.products);
  const addToCart = usePOSStore((state) => state.addToCart);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navigationItems = [
    { title: "POS Terminal Screen", href: "/pos", category: "Navigation" },
    { title: "Analytics Dashboard", href: "/dashboard", category: "Navigation" },
    { title: "Product Catalog Editor", href: "/products", category: "Navigation" },
    { title: "Inventory Stock Levels", href: "/inventory", category: "Navigation" },
    { title: "Customers Profiles & Khata", href: "/customers", category: "Navigation" },
    { title: "Register Shifts & Float Audit", href: "/shifts", category: "Navigation" },
    { title: "Financial Reports & Analytics", href: "/reports", category: "Navigation" },
    { title: "User Access Roles & PINs", href: "/users", category: "Navigation" },
    { title: "Sales Returns & Restocking", href: "/returns", category: "Navigation" },
    { title: "Barcode Label Generator", href: "/labels", category: "Navigation" },
  ];

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return navigationItems;

    const navMatches = navigationItems.filter(item =>
      item.title.toLowerCase().includes(q)
    );

    const productMatches = products
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
      )
      .slice(0, 5)
      .map(p => ({
        title: `Add ${p.name} to Cart`,
        action: () => {
          addToCart(p);
        },
        category: "Products",
        sku: p.sku,
        price: p.sellingPrice
      }));

    return [...navMatches, ...productMatches];
  }, [query, products, addToCart]) as any[];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const activeItem = filteredItems[selectedIndex];
        if (activeItem) {
          triggerItem(activeItem);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, setIsOpen]);

  const triggerItem = (item: any) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center z-50 p-4 pt-[12vh]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border flex flex-col max-h-[60vh] animate-in fade-in slide-in-from-top-4 duration-150">
        
        {/* Search input bar */}
        <div className="p-4 border-b flex items-center gap-3 shrink-0">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a page name or search product catalog..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-grow bg-transparent text-sm text-gray-900 focus:outline-none placeholder-gray-400"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Results scroll container */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredItems.map((item, index) => {
            const active = index === selectedIndex;
            return (
              <div
                key={index}
                onClick={() => triggerItem(item)}
                className={`flex items-center justify-between px-3.5 py-3.5 rounded-xl cursor-pointer transition-colors ${
                  active ? "bg-indigo-50 text-indigo-900" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.category === "Navigation" ? (
                    <FileText className={`h-4 w-4 shrink-0 ${active ? "text-indigo-600" : "text-gray-400"}`} />
                  ) : (
                    <Package className={`h-4 w-4 shrink-0 ${active ? "text-indigo-600" : "text-gray-400"}`} />
                  )}
                  <div className="truncate">
                    <p className="text-xs font-semibold">{item.title}</p>
                    {item.sku && (
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {item.sku} • ₹{item.price}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold tracking-wider ${
                    item.category === "Navigation" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {item.category}
                  </span>
                  {active && (
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-0.5">
                      Enter <CornerDownLeft className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No matching actions or products found.</p>
          )}
        </div>
        
        {/* Footer shortcuts helper */}
        <div className="p-3 border-t bg-gray-50 text-[10px] text-gray-400 flex justify-between shrink-0 font-medium">
          <span>Use ↑↓ arrows to navigate, Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
