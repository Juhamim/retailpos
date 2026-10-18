import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/user_model.dart';
import '../../models/product_model.dart';
import '../../models/sale_model.dart';
import '../../models/shift_model.dart';
import '../../models/customer_model.dart';
import '../../models/supplier_model.dart';
import '../../models/expense_model.dart';
import '../../models/inventory_movement_model.dart';
import '../constants/app_enums.dart';

class LocalStorage {
  static const String keyUsers = 'retailflow_users';
  static const String keyProducts = 'retailflow_products';
  static const String keySales = 'retailflow_sales';
  static const String keyShifts = 'retailflow_shifts';
  static const String keyCustomers = 'retailflow_customers';
  static const String keySuppliers = 'retailflow_suppliers';
  static const String keyPurchases = 'retailflow_purchases';
  static const String keyExpenses = 'retailflow_expenses';
  static const String keyInventoryLogs = 'retailflow_inventory_logs';
  static const String keyCurrentUser = 'retailflow_current_user';
  static const String keyActiveShift = 'retailflow_active_shift';

  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    await _seedInitialDataIfEmpty();
  }

  static Future<void> _seedInitialDataIfEmpty() async {
    // 1. Seed Users (Cashier PIN 1111, Manager PIN 1234)
    if (_prefs?.getString(keyUsers) == null) {
      final defaultUsers = [
        UserModel(
          id: 'user-cashier-1',
          username: 'cashier',
          email: 'cashier@retailflow.com',
          pin: '1111',
          firstName: 'Alex',
          lastName: 'Morgan',
          role: UserRole.cashier,
          createdAt: DateTime.now().toIso8601String(),
        ),
        UserModel(
          id: 'user-manager-1',
          username: 'manager',
          email: 'manager@retailflow.com',
          pin: '1234',
          firstName: 'Sarah',
          lastName: 'Connor',
          role: UserRole.manager,
          createdAt: DateTime.now().toIso8601String(),
        ),
      ];
      await saveUsers(defaultUsers);
    }

    // 2. Seed Initial Products
    if (_prefs?.getString(keyProducts) == null) {
      final defaultProducts = [
        ProductModel(
          id: 'prod-1',
          name: 'Organic Milk 1L',
          sku: 'MLK-001',
          barcode: '890103001001',
          category: 'Dairy & Grocery',
          costPrice: 42.0,
          sellingPrice: 65.0,
          taxRate: 5.0,
          stockQuantity: 45,
          minStockAlert: 10,
          unit: 'ltr',
          updatedAt: DateTime.now().toIso8601String(),
        ),
        ProductModel(
          id: 'prod-2',
          name: 'Whole Wheat Bread 400g',
          sku: 'BRD-002',
          barcode: '890103001002',
          category: 'Bakery',
          costPrice: 28.0,
          sellingPrice: 45.0,
          taxRate: 0.0,
          stockQuantity: 28,
          minStockAlert: 8,
          unit: 'pcs',
          updatedAt: DateTime.now().toIso8601String(),
        ),
        ProductModel(
          id: 'prod-3',
          name: 'Basmati Rice 5kg Premium',
          sku: 'RCE-003',
          barcode: '890103001003',
          category: 'Staples & Grains',
          costPrice: 380.0,
          sellingPrice: 520.0,
          taxRate: 5.0,
          stockQuantity: 18,
          minStockAlert: 5,
          unit: 'bag',
          updatedAt: DateTime.now().toIso8601String(),
        ),
        ProductModel(
          id: 'prod-4',
          name: 'Dark Roast Arabica Coffee 250g',
          sku: 'COF-004',
          barcode: '890103001004',
          category: 'Beverages',
          costPrice: 190.0,
          sellingPrice: 310.0,
          taxRate: 12.0,
          stockQuantity: 32,
          minStockAlert: 6,
          unit: 'pcs',
          updatedAt: DateTime.now().toIso8601String(),
        ),
        ProductModel(
          id: 'prod-5',
          name: 'Farm Fresh Eggs (12-pack)',
          sku: 'EGG-005',
          barcode: '890103001005',
          category: 'Dairy & Grocery',
          costPrice: 68.0,
          sellingPrice: 95.0,
          taxRate: 0.0,
          stockQuantity: 24,
          minStockAlert: 8,
          unit: 'box',
          updatedAt: DateTime.now().toIso8601String(),
        ),
        ProductModel(
          id: 'prod-6',
          name: 'Cold Pressed Olive Oil 500ml',
          sku: 'OIL-006',
          barcode: '890103001006',
          category: 'Staples & Grains',
          costPrice: 420.0,
          sellingPrice: 650.0,
          taxRate: 12.0,
          stockQuantity: 12,
          minStockAlert: 4,
          unit: 'btl',
          updatedAt: DateTime.now().toIso8601String(),
        ),
        ProductModel(
          id: 'prod-7',
          name: 'Alfonso Mango Juice 1L',
          sku: 'JUC-007',
          barcode: '890103001007',
          category: 'Beverages',
          costPrice: 75.0,
          sellingPrice: 120.0,
          taxRate: 12.0,
          stockQuantity: 40,
          minStockAlert: 10,
          unit: 'btl',
          updatedAt: DateTime.now().toIso8601String(),
        ),
        ProductModel(
          id: 'prod-8',
          name: 'Handcrafted Chocolate Bar 100g',
          sku: 'CHK-008',
          barcode: '890103001008',
          category: 'Snacks & Sweets',
          costPrice: 85.0,
          sellingPrice: 150.0,
          taxRate: 18.0,
          stockQuantity: 3, // Low stock demo
          minStockAlert: 5,
          unit: 'pcs',
          updatedAt: DateTime.now().toIso8601String(),
        ),
      ];
      await saveProducts(defaultProducts);
    }

    // 3. Seed Customers
    if (_prefs?.getString(keyCustomers) == null) {
      final defaultCustomers = [
        CustomerModel(
          id: 'cust-1',
          name: 'Rahul Sharma',
          phone: '+91 98765 43210',
          email: 'rahul@example.com',
          creditBalance: 1250.0,
          creditLimit: 10000.0,
          loyaltyPoints: 180,
          totalSpent: 8450.0,
          totalOrders: 14,
          ledger: [
            CustomerCreditEntry(
              id: 'ledg-1',
              type: 'charge',
              amount: 1250.0,
              description: 'Store Credit Purchase (Inv: INV-20260901-1002)',
              date: DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
            ),
          ],
          createdAt: DateTime.now().toIso8601String(),
        ),
        CustomerModel(
          id: 'cust-2',
          name: 'Priya Patel',
          phone: '+91 98123 45678',
          email: 'priya.p@example.com',
          creditBalance: 0.0,
          creditLimit: 5000.0,
          loyaltyPoints: 420,
          totalSpent: 16800.0,
          totalOrders: 28,
          createdAt: DateTime.now().toIso8601String(),
        ),
      ];
      await saveCustomers(defaultCustomers);
    }

    // 4. Seed Suppliers
    if (_prefs?.getString(keySuppliers) == null) {
      final defaultSuppliers = [
        SupplierModel(
          id: 'supp-1',
          name: 'Metro Wholesale FMCG Ltd',
          contactPerson: 'Vikram Mehta',
          phone: '+91 99001 12233',
          email: 'orders@metrowholesale.in',
          gstin: '29AABCU9603R1ZM',
          outstandingBalance: 14500.0,
          createdAt: DateTime.now().toIso8601String(),
        ),
        SupplierModel(
          id: 'supp-2',
          name: 'Heritage Dairy Farms Co.',
          contactPerson: 'Anand Kumar',
          phone: '+91 99445 66778',
          gstin: '29AABCH4432K1ZP',
          outstandingBalance: 3200.0,
          createdAt: DateTime.now().toIso8601String(),
        ),
      ];
      await saveSuppliers(defaultSuppliers);
    }

    // 5. Seed Expenses
    if (_prefs?.getString(keyExpenses) == null) {
      final defaultExpenses = [
        ExpenseModel(
          id: 'exp-1',
          title: 'Store Electricity Bill - Aug',
          category: ExpenseCategory.electricity,
          amount: 3450.0,
          paymentMethod: PaymentMethod.upi,
          recordedBy: 'Sarah (Manager)',
          date: DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
          createdAt: DateTime.now().toIso8601String(),
        ),
        ExpenseModel(
          id: 'exp-2',
          title: 'Packaging & Carry Bags Stock',
          category: ExpenseCategory.inventory,
          amount: 1200.0,
          paymentMethod: PaymentMethod.cash,
          recordedBy: 'Sarah (Manager)',
          date: DateTime.now().toIso8601String(),
          createdAt: DateTime.now().toIso8601String(),
        ),
      ];
      await saveExpenses(defaultExpenses);
    }
  }

  // --- Users ---
  static List<UserModel> getUsers() {
    final raw = _prefs?.getString(keyUsers);
    if (raw == null) return [];
    final List<dynamic> list = jsonDecode(raw);
    return list.map((e) => UserModel.fromJson(e)).toList();
  }

  static Future<void> saveUsers(List<UserModel> users) async {
    final raw = jsonEncode(users.map((e) => e.toJson()).toList());
    await _prefs?.setString(keyUsers, raw);
  }

  static UserModel? getCurrentUser() {
    final raw = _prefs?.getString(keyCurrentUser);
    if (raw == null) return null;
    return UserModel.fromJson(jsonDecode(raw));
  }

  static Future<void> saveCurrentUser(UserModel? user) async {
    if (user == null) {
      await _prefs?.remove(keyCurrentUser);
    } else {
      await _prefs?.setString(keyCurrentUser, jsonEncode(user.toJson()));
    }
  }

  // --- Products ---
  static List<ProductModel> getProducts() {
    final raw = _prefs?.getString(keyProducts);
    if (raw == null) return [];
    final List<dynamic> list = jsonDecode(raw);
    return list.map((e) => ProductModel.fromJson(e)).toList();
  }

  static Future<void> saveProducts(List<ProductModel> products) async {
    final raw = jsonEncode(products.map((e) => e.toJson()).toList());
    await _prefs?.setString(keyProducts, raw);
  }

  // --- Sales ---
  static List<SaleModel> getSales() {
    final raw = _prefs?.getString(keySales);
    if (raw == null) return [];
    final List<dynamic> list = jsonDecode(raw);
    return list.map((e) => SaleModel.fromJson(e)).toList();
  }

  static Future<void> saveSales(List<SaleModel> sales) async {
    final raw = jsonEncode(sales.map((e) => e.toJson()).toList());
    await _prefs?.setString(keySales, raw);
  }

  // --- Shifts ---
  static List<ShiftModel> getShifts() {
    final raw = _prefs?.getString(keyShifts);
    if (raw == null) return [];
    final List<dynamic> list = jsonDecode(raw);
    return list.map((e) => ShiftModel.fromJson(e)).toList();
  }

  static Future<void> saveShifts(List<ShiftModel> shifts) async {
    final raw = jsonEncode(shifts.map((e) => e.toJson()).toList());
    await _prefs?.setString(keyShifts, raw);
  }

  static ShiftModel? getActiveShift() {
    final raw = _prefs?.getString(keyActiveShift);
    if (raw == null) return null;
    return ShiftModel.fromJson(jsonDecode(raw));
  }

  static Future<void> saveActiveShift(ShiftModel? shift) async {
    if (shift == null) {
      await _prefs?.remove(keyActiveShift);
    } else {
      await _prefs?.setString(keyActiveShift, jsonEncode(shift.toJson()));
    }
  }

  // --- Customers ---
  static List<CustomerModel> getCustomers() {
    final raw = _prefs?.getString(keyCustomers);
    if (raw == null) return [];
    final List<dynamic> list = jsonDecode(raw);
    return list.map((e) => CustomerModel.fromJson(e)).toList();
  }

  static Future<void> saveCustomers(List<CustomerModel> customers) async {
    final raw = jsonEncode(customers.map((e) => e.toJson()).toList());
    await _prefs?.setString(keyCustomers, raw);
  }

  // --- Suppliers ---
  static List<SupplierModel> getSuppliers() {
    final raw = _prefs?.getString(keySuppliers);
    if (raw == null) return [];
    final List<dynamic> list = jsonDecode(raw);
    return list.map((e) => SupplierModel.fromJson(e)).toList();
  }

  static Future<void> saveSuppliers(List<SupplierModel> suppliers) async {
    final raw = jsonEncode(suppliers.map((e) => e.toJson()).toList());
    await _prefs?.setString(keySuppliers, raw);
  }

  // --- Expenses ---
  static List<ExpenseModel> getExpenses() {
    final raw = _prefs?.getString(keyExpenses);
    if (raw == null) return [];
    final List<dynamic> list = jsonDecode(raw);
    return list.map((e) => ExpenseModel.fromJson(e)).toList();
  }

  static Future<void> saveExpenses(List<ExpenseModel> expenses) async {
    final raw = jsonEncode(expenses.map((e) => e.toJson()).toList());
    await _prefs?.setString(keyExpenses, raw);
  }

  // --- Inventory Movement Logs ---
  static List<InventoryMovementModel> getInventoryLogs() {
    final raw = _prefs?.getString(keyInventoryLogs);
    if (raw == null) return [];
    final List<dynamic> list = jsonDecode(raw);
    return list.map((e) => InventoryMovementModel.fromJson(e)).toList();
  }

  static Future<void> saveInventoryLogs(
      List<InventoryMovementModel> logs) async {
    final raw = jsonEncode(logs.map((e) => e.toJson()).toList());
    await _prefs?.setString(keyInventoryLogs, raw);
  }
}
