import 'package:flutter/foundation.dart';
import '../../models/expense_model.dart';
import '../../core/constants/app_enums.dart';
import '../../core/database/local_storage.dart';

class ExpenseProvider extends ChangeNotifier {
  List<ExpenseModel> _expenses = [];

  List<ExpenseModel> get expenses => _expenses;

  double get totalExpenses =>
      _expenses.fold(0.0, (sum, exp) => sum + exp.amount);

  ExpenseProvider() {
    loadExpenses();
  }

  void loadExpenses() {
    _expenses = LocalStorage.getExpenses();
    notifyListeners();
  }

  Future<ExpenseModel> addExpense({
    required String title,
    required ExpenseCategory category,
    required double amount,
    required PaymentMethod paymentMethod,
    String? receiptRef,
    String? notes,
    required String recordedBy,
  }) async {
    final expense = ExpenseModel(
      id: 'exp-${DateTime.now().millisecondsSinceEpoch}',
      title: title.trim(),
      category: category,
      amount: amount,
      paymentMethod: paymentMethod,
      receiptRef: receiptRef?.trim(),
      notes: notes?.trim(),
      recordedBy: recordedBy,
      date: DateTime.now().toIso8601String(),
      createdAt: DateTime.now().toIso8601String(),
    );

    _expenses.insert(0, expense);
    await LocalStorage.saveExpenses(_expenses);
    notifyListeners();
    return expense;
  }

  Future<void> deleteExpense(String id) async {
    _expenses.removeWhere((e) => e.id == id);
    await LocalStorage.saveExpenses(_expenses);
    notifyListeners();
  }
}
