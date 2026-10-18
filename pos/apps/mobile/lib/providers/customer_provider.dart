import 'package:flutter/foundation.dart';
import '../../models/customer_model.dart';
import '../../core/database/local_storage.dart';

class CustomerProvider extends ChangeNotifier {
  List<CustomerModel> _customers = [];
  String _searchQuery = '';

  List<CustomerModel> get customers => _customers;
  String get searchQuery => _searchQuery;

  List<CustomerModel> get filteredCustomers {
    final q = _searchQuery.trim().toLowerCase();
    if (q.isEmpty) return _customers;
    return _customers.where((c) {
      return c.name.toLowerCase().contains(q) ||
          c.phone.contains(q) ||
          (c.email?.toLowerCase().contains(q) ?? false);
    }).toList();
  }

  CustomerProvider() {
    loadCustomers();
  }

  void loadCustomers() {
    _customers = LocalStorage.getCustomers();
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<CustomerModel> addCustomer({
    required String name,
    required String phone,
    String? email,
    String? address,
    double creditLimit = 10000.0,
  }) async {
    final customer = CustomerModel(
      id: 'cust-${DateTime.now().millisecondsSinceEpoch}',
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      address: address?.trim(),
      creditLimit: creditLimit,
      createdAt: DateTime.now().toIso8601String(),
    );
    _customers.insert(0, customer);
    await LocalStorage.saveCustomers(_customers);
    notifyListeners();
    return customer;
  }

  Future<void> updateCustomer(CustomerModel updated) async {
    final idx = _customers.indexWhere((c) => c.id == updated.id);
    if (idx != -1) {
      _customers[idx] = updated;
      await LocalStorage.saveCustomers(_customers);
      notifyListeners();
    }
  }

  /// Add POS order to customer stats
  Future<void> recordCustomerSale(String customerId, double saleTotal) async {
    final idx = _customers.indexWhere((c) => c.id == customerId);
    if (idx != -1) {
      final c = _customers[idx];
      final pointsEarned = (saleTotal / 100).floor(); // 1 pt per ₹100
      _customers[idx] = c.copyWith(
        totalSpent: c.totalSpent + saleTotal,
        totalOrders: c.totalOrders + 1,
        loyaltyPoints: c.loyaltyPoints + pointsEarned,
      );
      await LocalStorage.saveCustomers(_customers);
      notifyListeners();
    }
  }

  /// Charge Udhaar Store Credit or Settle payment in Khata
  Future<void> recordCreditTransaction({
    required String customerId,
    required String type, // 'charge' | 'payment'
    required double amount,
    required String description,
  }) async {
    final idx = _customers.indexWhere((c) => c.id == customerId);
    if (idx == -1) return;

    final c = _customers[idx];
    final newBalance = type == 'charge'
        ? c.creditBalance + amount
        : (c.creditBalance - amount).clamp(0.0, double.infinity);

    final entry = CustomerCreditEntry(
      id: 'ledg-${DateTime.now().millisecondsSinceEpoch}',
      type: type,
      amount: amount,
      description: description,
      date: DateTime.now().toIso8601String(),
    );

    _customers[idx] = c.copyWith(
      creditBalance: newBalance,
      ledger: [entry, ...c.ledger],
    );

    await LocalStorage.saveCustomers(_customers);
    notifyListeners();
  }
}
