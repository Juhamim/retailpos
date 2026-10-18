import 'package:flutter/foundation.dart';
import '../../models/shift_model.dart';
import '../../models/sale_model.dart';
import '../../core/constants/app_enums.dart';
import '../../core/database/local_storage.dart';

class ShiftProvider extends ChangeNotifier {
  ShiftModel? _activeShift;
  List<ShiftModel> _pastShifts = [];

  ShiftModel? get activeShift => _activeShift;
  List<ShiftModel> get pastShifts => _pastShifts;
  bool get hasActiveShift => _activeShift != null;

  ShiftProvider() {
    loadShifts();
  }

  void loadShifts() {
    _activeShift = LocalStorage.getActiveShift();
    _pastShifts = LocalStorage.getShifts();
    notifyListeners();
  }

  /// Open new cashier shift
  Future<void> openShift({
    required String cashierId,
    required String cashierName,
    required double openingCash,
  }) async {
    final shift = ShiftModel(
      id: 'shift-${DateTime.now().millisecondsSinceEpoch}',
      cashierId: cashierId,
      cashierName: cashierName,
      startTime: DateTime.now().toIso8601String(),
      openingCash: openingCash,
      isOpen: true,
    );
    _activeShift = shift;
    await LocalStorage.saveActiveShift(shift);
    notifyListeners();
  }

  /// Add Cash In or Cash Drop movement to active shift
  Future<void> addShiftMovement({
    required String type, // 'cash_in' | 'cash_out'
    required double amount,
    required String reason,
  }) async {
    if (_activeShift == null) return;

    final movement = ShiftMovement(
      id: 'mov-${DateTime.now().millisecondsSinceEpoch}',
      type: type,
      amount: amount,
      reason: reason,
      timestamp: DateTime.now().toIso8601String(),
    );

    final updated = _activeShift!.copyWith(
      movements: [..._activeShift!.movements, movement],
    );

    _activeShift = updated;
    await LocalStorage.saveActiveShift(updated);
    notifyListeners();
  }

  /// Record a sale into active shift tallies
  Future<void> recordSaleInShift(double totalAmount, List<PaymentRecord> payments) async {
    if (_activeShift == null) return;

    double cashSum = 0;
    double upiSum = 0;
    double cardSum = 0;
    double creditSum = 0;

    for (final p in payments) {
      switch (p.method) {
        case PaymentMethod.cash:
          cashSum += p.amount;
          break;
        case PaymentMethod.upi:
          upiSum += p.amount;
          break;
        case PaymentMethod.card:
          cardSum += p.amount;
          break;
        case PaymentMethod.credit:
        case PaymentMethod.giftCard:
          creditSum += p.amount;
          break;
      }
    }

    final updated = _activeShift!.copyWith(
      totalCashSales: _activeShift!.totalCashSales + cashSum,
      totalUpiSales: _activeShift!.totalUpiSales + upiSum,
      totalCardSales: _activeShift!.totalCardSales + cardSum,
      totalCreditSales: _activeShift!.totalCreditSales + creditSum,
      totalGrossSales: _activeShift!.totalGrossSales + totalAmount,
      totalTransactions: _activeShift!.totalTransactions + 1,
    );

    _activeShift = updated;
    await LocalStorage.saveActiveShift(updated);
    notifyListeners();
  }

  /// Close shift & generate Z-Report
  Future<ShiftModel?> closeShift({
    required double closingCashActual,
    String? notes,
  }) async {
    if (_activeShift == null) return null;

    final expected = _activeShift!.expectedCashInDrawer;
    final variance = closingCashActual - expected;

    final closed = _activeShift!.copyWith(
      endTime: DateTime.now().toIso8601String(),
      closingCashActual: closingCashActual,
      variance: variance,
      notes: notes,
      isOpen: false,
    );

    _pastShifts.insert(0, closed);
    _activeShift = null;

    await LocalStorage.saveActiveShift(null);
    await LocalStorage.saveShifts(_pastShifts);
    notifyListeners();

    return closed;
  }
}
