"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Key,
  ArrowLeftRight,
  Barcode,
  Users2,
  FileText,
  CreditCard,
  Wallet
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useSettingsStore } from "@/stores/settings-store";
import { UserRole } from "@retailflow/shared-types";

export default function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const currentUser = useAppStore((s) => s.currentUser);
  const shop = useSettingsStore((s) => s.settings.shop);
  const pathname = usePathname();

  const userRole = currentUser?.role || UserRole.CASHIER;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { href: "/pos", label: "POS Terminal", icon: ShoppingCart, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER] },
    { href: "/products", label: "Products", icon: Package, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { href: "/inventory", label: "Inventory", icon: Warehouse, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { href: "/customers", label: "Customers", icon: Users, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER] },
    { href: "/shifts", label: "Register Shifts", icon: Key, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER] },
    { href: "/returns", label: "Sales Returns", icon: ArrowLeftRight, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER] },
    { href: "/labels", label: "Print Barcodes", icon: Barcode, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { href: "/suppliers", label: "Suppliers", icon: Truck, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { href: "/purchases", label: "Supplier Bills", icon: FileText, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { href: "/giftcards", label: "Store Gift Cards", icon: CreditCard, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { href: "/expenses", label: "Expenses", icon: Receipt, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { href: "/accounts", label: "Accounts & Cash", icon: Wallet, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { href: "/reports", label: "Reports & GST", icon: BarChart3, roles: [UserRole.OWNER, UserRole.MANAGER] },
    { href: "/users", label: "Manage Users", icon: Users2, roles: [UserRole.OWNER] },
    { href: "/settings", label: "Settings", icon: Settings, roles: [UserRole.OWNER] },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole));

  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
    : "AD";
  const displayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : "Admin Cashier";
  const role = currentUser?.role ?? "Store Owner";

  return (
    <aside
      className="flex flex-col h-full bg-slate-900 dark:bg-slate-950 text-white transition-all duration-300 ease-in-out shrink-0 border-r border-slate-800 shadow-xl"
      style={{ width: collapsed ? 72 : 260 }}
    >
      <div className="flex items-center justify-between px-3.5 py-4 border-b border-slate-800/60">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden pl-1">
            {shop.logo ? (
              <img
                src={shop.logo}
                alt={shop.shopName}
                className="h-8 max-w-[120px] object-contain rounded shrink-0 bg-white/5 p-0.5"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-sm shadow-md shrink-0">
                {shop.shopName?.[0] || "R"}
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-black tracking-tight text-white truncate max-w-[140px]">
                {shop.shopName || "RetailFlow"}
              </p>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                Retail Terminal
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            {shop.logo ? (
              <img src={shop.logo} alt="Logo" className="w-8 h-8 object-contain rounded" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-sm">
                {shop.shopName?.[0] || "R"}
              </div>
            )}
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-200 ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        {visibleNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 group ${
                active
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white hover:translate-x-1"
              } ${collapsed ? "justify-center px-0 py-3" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 p-4 bg-slate-900/60 backdrop-blur-sm">
        <div
          className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-500/20">
            {initials}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-slate-100">{displayName}</p>
              <p className="truncate text-xs text-indigo-400 font-medium capitalize mt-0.5">
                {role}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

