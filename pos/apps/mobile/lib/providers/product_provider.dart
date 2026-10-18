import 'package:flutter/foundation.dart';
import '../../models/product_model.dart';
import '../../models/inventory_movement_model.dart';
import '../../core/database/local_storage.dart';

class ProductProvider extends ChangeNotifier {
  List<ProductModel> _products = [];
  String _selectedCategory = 'All';
  String _searchQuery = '';
  List<InventoryMovementModel> _inventoryLogs = [];

  List<ProductModel> get products => _products;
  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;
  List<InventoryMovementModel> get inventoryLogs => _inventoryLogs;

  List<String> get categories {
    final set = <String>{'All'};
    for (final p in _products) {
      if (p.category.isNotEmpty) {
        set.add(p.category);
      }
    }
    return set.toList();
  }

  List<ProductModel> get filteredProducts {
    return _products.where((p) {
      final matchesCategory =
          _selectedCategory == 'All' || p.category == _selectedCategory;
      final q = _searchQuery.trim().toLowerCase();
      final matchesQuery = q.isEmpty ||
          p.name.toLowerCase().contains(q) ||
          p.sku.toLowerCase().contains(q) ||
          p.barcode.contains(q);
      return matchesCategory && matchesQuery;
    }).toList();
  }

  int get lowStockCount => _products.where((p) => p.isLowStock).length;
  int get outOfStockCount => _products.where((p) => p.isOutOfStock).length;

  ProductProvider() {
    loadProducts();
  }

  void loadProducts() {
    _products = LocalStorage.getProducts();
    _inventoryLogs = LocalStorage.getInventoryLogs();
    notifyListeners();
  }

  void setCategory(String cat) {
    _selectedCategory = cat;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  ProductModel? findByBarcode(String barcode) {
    final q = barcode.trim();
    for (final p in _products) {
      if (p.barcode == q || p.sku.toLowerCase() == q.toLowerCase()) {
        return p;
      }
    }
    return null;
  }

  Future<void> addProduct(ProductModel product) async {
    _products.insert(0, product);
    await LocalStorage.saveProducts(_products);
    notifyListeners();
  }

  Future<void> updateProduct(ProductModel updated) async {
    final idx = _products.indexWhere((p) => p.id == updated.id);
    if (idx != -1) {
      _products[idx] = updated;
      await LocalStorage.saveProducts(_products);
      notifyListeners();
    }
  }

  Future<void> deleteProduct(String id) async {
    _products.removeWhere((p) => p.id == id);
    await LocalStorage.saveProducts(_products);
    notifyListeners();
  }

  /// Deduct stock for completed sales
  Future<void> deductStock(List<({String productId, int quantity})> items) async {
    final now = DateTime.now().toIso8601String();
    for (final item in items) {
      final idx = _products.indexWhere((p) => p.id == item.productId);
      if (idx != -1) {
        final p = _products[idx];
        final newQty = (p.stockQuantity - item.quantity).clamp(0, 999999);
        _products[idx] = p.copyWith(stockQuantity: newQty, updatedAt: now);

        _inventoryLogs.insert(
          0,
          InventoryMovementModel(
            id: 'mov-${DateTime.now().millisecondsSinceEpoch}-${p.id}',
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            type: InventoryMovementType.sale,
            quantityChanged: -item.quantity,
            stockAfter: newQty,
            reason: 'POS Sale Deduction',
            performedBy: 'POS Terminal',
            timestamp: now,
          ),
        );
      }
    }
    await LocalStorage.saveProducts(_products);
    await LocalStorage.saveInventoryLogs(_inventoryLogs);
    notifyListeners();
  }

  /// Restock / Damaged / Audit stock movement
  Future<void> recordStockMovement({
    required String productId,
    required InventoryMovementType type,
    required int quantityChanged, // + for restock, - for damage, or target count
    required String reason,
    required String performedBy,
    bool isAuditTarget = false,
  }) async {
    final idx = _products.indexWhere((p) => p.id == productId);
    if (idx == -1) return;

    final p = _products[idx];
    int newStock;
    int delta;

    if (isAuditTarget) {
      newStock = quantityChanged;
      delta = newStock - p.stockQuantity;
    } else {
      newStock = (p.stockQuantity + quantityChanged).clamp(0, 999999);
      delta = quantityChanged;
    }

    final now = DateTime.now().toIso8601String();
    _products[idx] = p.copyWith(stockQuantity: newStock, updatedAt: now);

    _inventoryLogs.insert(
      0,
      InventoryMovementModel(
        id: 'mov-${DateTime.now().millisecondsSinceEpoch}',
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        type: type,
        quantityChanged: delta,
        stockAfter: newStock,
        reason: reason,
        performedBy: performedBy,
        timestamp: now,
      ),
    );

    await LocalStorage.saveProducts(_products);
    await LocalStorage.saveInventoryLogs(_inventoryLogs);
    notifyListeners();
  }
}
