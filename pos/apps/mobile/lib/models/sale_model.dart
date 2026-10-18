import '../core/constants/app_enums.dart';

class PaymentRecord {
  final PaymentMethod method;
  final double amount;
  final String? reference;

  PaymentRecord({
    required this.method,
    required this.amount,
    this.reference,
  });

  Map<String, dynamic> toJson() => {
        'method': method.value,
        'amount': amount,
        'reference': reference,
      };

  factory PaymentRecord.fromJson(Map<String, dynamic> json) => PaymentRecord(
        method: PaymentMethod.fromString(json['method'] ?? 'cash'),
        amount: (json['amount'] ?? 0).toDouble(),
        reference: json['reference'],
      );
}

class SaleItemRecord {
  final String productId;
  final String productName;
  final String sku;
  final double unitPrice;
  final int quantity;
  final double discountPercent;
  final double taxRate;
  final double taxAmount;
  final double total;

  SaleItemRecord({
    required this.productId,
    required this.productName,
    required this.sku,
    required this.unitPrice,
    required this.quantity,
    required this.discountPercent,
    required this.taxRate,
    required this.taxAmount,
    required this.total,
  });

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'productName': productName,
        'sku': sku,
        'unitPrice': unitPrice,
        'quantity': quantity,
        'discountPercent': discountPercent,
        'taxRate': taxRate,
        'taxAmount': taxAmount,
        'total': total,
      };

  factory SaleItemRecord.fromJson(Map<String, dynamic> json) => SaleItemRecord(
        productId: json['productId'] ?? '',
        productName: json['productName'] ?? '',
        sku: json['sku'] ?? '',
        unitPrice: (json['unitPrice'] ?? 0).toDouble(),
        quantity: (json['quantity'] ?? 1).toInt(),
        discountPercent: (json['discountPercent'] ?? 0).toDouble(),
        taxRate: (json['taxRate'] ?? 0).toDouble(),
        taxAmount: (json['taxAmount'] ?? 0).toDouble(),
        total: (json['total'] ?? 0).toDouble(),
      );
}

class SaleModel {
  final String id;
  final String invoiceNumber;
  final String? customerId;
  final String customerName;
  final List<SaleItemRecord> items;
  final double subtotal;
  final double taxAmount;
  final double discountAmount;
  final double totalAmount;
  final PaymentMethod paymentMethod;
  final List<PaymentRecord> payments;
  final SaleStatus status;
  final String cashierName;
  final String createdAt;

  SaleModel({
    required this.id,
    required this.invoiceNumber,
    this.customerId,
    required this.customerName,
    required this.items,
    required this.subtotal,
    required this.taxAmount,
    required this.discountAmount,
    required this.totalAmount,
    required this.paymentMethod,
    required this.payments,
    this.status = SaleStatus.completed,
    required this.cashierName,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'invoiceNumber': invoiceNumber,
        'customerId': customerId,
        'customerName': customerName,
        'items': items.map((i) => i.toJson()).toList(),
        'subtotal': subtotal,
        'taxAmount': taxAmount,
        'discountAmount': discountAmount,
        'totalAmount': totalAmount,
        'paymentMethod': paymentMethod.value,
        'payments': payments.map((p) => p.toJson()).toList(),
        'status': status.name,
        'cashierName': cashierName,
        'createdAt': createdAt,
      };

  factory SaleModel.fromJson(Map<String, dynamic> json) => SaleModel(
        id: json['id'] ?? '',
        invoiceNumber: json['invoiceNumber'] ?? '',
        customerId: json['customerId'],
        customerName: json['customerName'] ?? 'Walk-in Customer',
        items: (json['items'] as List<dynamic>? ?? [])
            .map((i) => SaleItemRecord.fromJson(i))
            .toList(),
        subtotal: (json['subtotal'] ?? 0).toDouble(),
        taxAmount: (json['taxAmount'] ?? 0).toDouble(),
        discountAmount: (json['discountAmount'] ?? 0).toDouble(),
        totalAmount: (json['totalAmount'] ?? 0).toDouble(),
        paymentMethod:
            PaymentMethod.fromString(json['paymentMethod'] ?? 'cash'),
        payments: (json['payments'] as List<dynamic>? ?? [])
            .map((p) => PaymentRecord.fromJson(p))
            .toList(),
        status: SaleStatus.fromString(json['status'] ?? 'completed'),
        cashierName: json['cashierName'] ?? 'Cashier',
        createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
      );
}
