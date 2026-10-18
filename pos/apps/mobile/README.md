# RetailFlow POS — Flutter Android Mobile & Tablet Application

Native Flutter Android Point of Sale (POS) client engineered for mobile devices and touchscreen Android POS terminals. Built with strict role-based access for **Cashier** and **Manager** roles, matching the web design system.

---

## 🔐 Demo User Credentials & Permissions

| Role | PIN | Username / Password | Available Screens / Permissions |
| :--- | :---: | :---: | :--- |
| **Cashier** | `1111` | `cashier` / `1234` | **POS Terminal**, **Register Shifts (Z-Report)**, **Customers (Khata)**, **Sales Returns** |
| **Manager** | `1234` | `manager` / `1234` | **All Cashier Features** + **Executive Dashboard**, **Products Catalog (CRUD)**, **Inventory Adjustments (Restock/Damage/Audit)**, **Barcode Label Generator**, **Suppliers**, **Expenses**, **Reports & GST** |

---

## 🚀 How to Run & Build

### 1. Install Flutter Dependencies
```bash
cd pos/apps/mobile
flutter pub get
```

### 2. Run on Android Device / Emulator
```bash
flutter run
```

### 3. Build Release Android APK
```bash
flutter build apk --release
# Output APK location:
# build/app/outputs/flutter-apk/app-release.apk
```

### 4. Build Android App Bundle (AAB for Google Play)
```bash
flutter build appbundle --release
```

---

## 🛠️ Architecture & Highlights

- **UI / UX Design**: Slate-900 header/drawer, vibrant Indigo accents (`#6366f1`), rounded surface cards, and Inter typography.
- **Adaptive Layout**: Automatically switches between single-column phone layout with a floating bottom cart and a dual-pane landscape tablet layout.
- **Hardware Integrations**:
  - **Camera & Laser Barcode Scanner**
  - **80mm & 58mm ESC/POS Thermal Receipt Printing**
  - **A4 PDF Tax Invoice & Shift Z-Report Generation**
- **Offline-First Storage**: Local JSON serialization with seed demo catalog, orders, and Khata ledger.
