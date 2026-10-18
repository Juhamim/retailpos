import 'package:flutter/foundation.dart';
import '../../models/supplier_model.dart';
import '../../core/database/local_storage.dart';

class SupplierProvider extends ChangeNotifier {
  List<SupplierModel> _suppliers = [];
  String _searchQuery = '';

  List<SupplierModel> get suppliers => _suppliers;
  String get searchQuery => _searchQuery;

  List<SupplierModel> get filteredSuppliers {
    final q = _searchQuery.trim().toLowerCase();
    if (q.isEmpty) return _suppliers;
    return _suppliers.where((s) {
      return s.name.toLowerCase().contains(q) ||
          s.contactPerson.toLowerCase().contains(q) ||
          s.phone.contains(q);
    }).toList();
  }

  SupplierProvider() {
    loadSuppliers();
  }

  void loadSuppliers() {
    _suppliers = LocalStorage.getSuppliers();
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<SupplierModel> addSupplier({
    required String name,
    required String contactPerson,
    required String phone,
    String? email,
    String? gstin,
    double outstandingBalance = 0.0,
  }) async {
    final supplier = SupplierModel(
      id: 'supp-${DateTime.now().millisecondsSinceEpoch}',
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      gstin: gstin?.trim(),
      outstandingBalance: outstandingBalance,
      createdAt: DateTime.now().toIso8601String(),
    );
    _suppliers.insert(0, supplier);
    await LocalStorage.saveSuppliers(_suppliers);
    notifyListeners();
    return supplier;
  }

  Future<void> updateSupplier(SupplierModel updated) async {
    final idx = _suppliers.indexWhere((s) => s.id == updated.id);
    if (idx != -1) {
      _suppliers[idx] = updated;
      await LocalStorage.saveSuppliers(_suppliers);
      notifyListeners();
    }
  }

  Future<void> deleteSupplier(String id) async {
    _suppliers.removeWhere((s) => s.id == id);
    await LocalStorage.saveSuppliers(_suppliers);
    notifyListeners();
  }
}
