import 'package:flutter/foundation.dart';
import '../../models/sale_model.dart';
import '../../models/product_model.dart';
import '../../models/expense_model.dart';
import '../../core/constants/app_enums.dart';

class DashboardProvider extends ChangeNotifier {
  // Calculates live dashboard KPIs from stores
  Map<String, dynamic> computeMetrics({
    required List<SaleModel> sales,
    required List<ProductModel> products,
    required List<ExpenseModel> expenses,
  }) {
    final today = DateTime.now();
    final todaySales = sales.where((s) {
      final dt = DateTime.tryParse(s.createdAt);
      if (dt == null) return false;
      return dt.year == today.year &&
          dt.month == today.month &&
          dt.day == today.day &&
          s.status == SaleStatus.completed;
    }).toList();

    final double grossRevenue =
        todaySales.fold(0.0, (sum, s) => sum + s.totalAmount);
    final int ordersCount = todaySales.length;

    // Payment distribution
    double cashSales = 0;
    double upiSales = 0;
    double cardSales = 0;
    double creditSales = 0;

    for (final s in todaySales) {
      for (final p in s.payments) {
        switch (p.method) {
          case PaymentMethod.cash:
            cashSales += p.amount;
            break;
          case PaymentMethod.upi:
            upiSales += p.amount;
            break;
          case PaymentMethod.card:
            cardSales += p.amount;
            break;
          case PaymentMethod.credit:
          case PaymentMethod.giftCard:
            creditSales += p.amount;
            break;
        }
      }
    }

    final double totalTaxCollected =
        todaySales.fold(0.0, (sum, s) => sum + s.taxAmount);
    final double totalDiscountGiven =
        todaySales.fold(0.0, (sum, s) => sum + s.discountAmount);

    final int lowStockItems = products.where((p) => p.isLowStock).length;
    final int outOfStockItems = products.where((p) => p.isOutOfStock).length;

    final double todayExpenses = expenses.where((e) {
      final dt = DateTime.tryParse(e.date);
      if (dt == null) return false;
      return dt.year == today.year &&
          dt.month == today.month &&
          dt.day == today.day;
    }).fold(0.0, (sum, e) => sum + e.amount);

    return {
      'grossRevenue': grossRevenue,
      'ordersCount': ordersCount,
      'cashSales': cashSales,
      'upiSales': upiSales,
      'cardSales': cardSales,
      'creditSales': creditSales,
      'totalTaxCollected': totalTaxCollected,
      'totalDiscountGiven': totalDiscountGiven,
      'lowStockItems': lowStockItems,
      'outOfStockItems': outOfStockItems,
      'todayExpenses': todayExpenses,
      'netProfitEstimate': (grossRevenue * 0.28) - todayExpenses,
    };
  }
}
