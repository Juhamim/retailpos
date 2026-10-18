import 'package:flutter/foundation.dart';
import '../../models/sale_model.dart';
import '../../core/constants/app_enums.dart';
import '../../core/database/local_storage.dart';

class SalesProvider extends ChangeNotifier {
  List<SaleModel> _sales = [];
  String _searchQuery = '';

  List<SaleModel> get sales => _sales;
  String get searchQuery => _searchQuery;

  List<SaleModel> get filteredSales {
    final q = _searchQuery.trim().toLowerCase();
    if (q.isEmpty) return _sales;
    return _sales.where((s) {
      return s.invoiceNumber.toLowerCase().contains(q) ||
          s.customerName.toLowerCase().contains(q) ||
          s.cashierName.toLowerCase().contains(q);
    }).toList();
  }

  SalesProvider() {
    loadSales();
  }

  void loadSales() {
    _sales = LocalStorage.getSales();
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<SaleModel> recordSale(SaleModel sale) async {
    _sales.insert(0, sale);
    await LocalStorage.saveSales(_sales);
    notifyListeners();
    return sale;
  }

  SaleModel? findByInvoice(String invoiceNumber) {
    final q = invoiceNumber.trim().toLowerCase();
    for (final s in _sales) {
      if (s.invoiceNumber.toLowerCase() == q) {
        return s;
      }
    }
    return null;
  }

  /// Process Sales Return / Refund
  Future<void> processReturn({
    required String invoiceNumber,
    required List<({String productId, int quantity})> returnedItems,
    required double refundAmount,
    required PaymentMethod refundMethod,
  }) async {
    final idx = _sales.indexWhere((s) => s.invoiceNumber == invoiceNumber);
    if (idx != -1) {
      final s = _sales[idx];
      // In a real system we can update status or append return records
      final updated = SaleModel(
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        customerId: s.customerId,
        customerName: s.customerName,
        items: s.items,
        subtotal: s.subtotal,
        taxAmount: s.taxAmount,
        discountAmount: s.discountAmount,
        totalAmount: s.totalAmount,
        paymentMethod: s.paymentMethod,
        payments: s.payments,
        status: SaleStatus.returned,
        cashierName: s.cashierName,
        createdAt: s.createdAt,
      );
      _sales[idx] = updated;
      await LocalStorage.saveSales(_sales);
      notifyListeners();
    }
  }
}
