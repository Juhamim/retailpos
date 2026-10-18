import '../core/constants/app_enums.dart';

class ExpenseModel {
  final String id;
  final String title;
  final ExpenseCategory category;
  final double amount;
  final PaymentMethod paymentMethod;
  final String? receiptRef;
  final String? notes;
  final String recordedBy;
  final String date;
  final String createdAt;

  ExpenseModel({
    required this.id,
    required this.title,
    required this.category,
    required this.amount,
    this.paymentMethod = PaymentMethod.cash,
    this.receiptRef,
    this.notes,
    required this.recordedBy,
    required this.date,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'category': category.name,
        'amount': amount,
        'paymentMethod': paymentMethod.value,
        'receiptRef': receiptRef,
        'notes': notes,
        'recordedBy': recordedBy,
        'date': date,
        'createdAt': createdAt,
      };

  factory ExpenseModel.fromJson(Map<String, dynamic> json) => ExpenseModel(
        id: json['id'] ?? '',
        title: json['title'] ?? '',
        category: ExpenseCategory.fromString(json['category'] ?? 'other'),
        amount: (json['amount'] ?? 0).toDouble(),
        paymentMethod:
            PaymentMethod.fromString(json['paymentMethod'] ?? 'cash'),
        receiptRef: json['receiptRef'],
        notes: json['notes'],
        recordedBy: json['recordedBy'] ?? 'Manager',
        date: json['date'] ?? DateTime.now().toIso8601String(),
        createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
      );
}
