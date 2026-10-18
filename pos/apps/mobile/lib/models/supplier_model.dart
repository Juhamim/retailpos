class SupplierModel {
  final String id;
  final String name;
  final String contactPerson;
  final String phone;
  final String? email;
  final String? gstin;
  final double outstandingBalance;
  final String createdAt;

  SupplierModel({
    required this.id,
    required this.name,
    required this.contactPerson,
    required this.phone,
    this.email,
    this.gstin,
    this.outstandingBalance = 0.0,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'contactPerson': contactPerson,
        'phone': phone,
        'email': email,
        'gstin': gstin,
        'outstandingBalance': outstandingBalance,
        'createdAt': createdAt,
      };

  factory SupplierModel.fromJson(Map<String, dynamic> json) => SupplierModel(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        contactPerson: json['contactPerson'] ?? '',
        phone: json['phone'] ?? '',
        email: json['email'],
        gstin: json['gstin'],
        outstandingBalance: (json['outstandingBalance'] ?? 0).toDouble(),
        createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
      );
}

class PurchaseBillItem {
  final String productId;
  final String productName;
  final int quantity;
  final double unitCost;
  final double total;

  PurchaseBillItem({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitCost,
    required this.total,
  });

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'productName': productName,
        'quantity': quantity,
        'unitCost': unitCost,
        'total': total,
      };

  factory PurchaseBillItem.fromJson(Map<String, dynamic> json) =>
      PurchaseBillItem(
        productId: json['productId'] ?? '',
        productName: json['productName'] ?? '',
        quantity: (json['quantity'] ?? 1).toInt(),
        unitCost: (json['unitCost'] ?? 0).toDouble(),
        total: (json['total'] ?? 0).toDouble(),
      );
}

class PurchaseBillModel {
  final String id;
  final String invoiceNumber;
  final String supplierId;
  final String supplierName;
  final List<PurchaseBillItem> items;
  final double totalAmount;
  final double paidAmount;
  final String status; // 'paid' | 'partial' | 'pending'
  final String billDate;
  final String createdAt;

  PurchaseBillModel({
    required this.id,
    required this.invoiceNumber,
    required this.supplierId,
    required this.supplierName,
    required this.items,
    required this.totalAmount,
    this.paidAmount = 0.0,
    this.status = 'paid',
    required this.billDate,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'invoiceNumber': invoiceNumber,
        'supplierId': supplierId,
        'supplierName': supplierName,
        'items': items.map((i) => i.toJson()).toList(),
        'totalAmount': totalAmount,
        'paidAmount': paidAmount,
        'status': status,
        'billDate': billDate,
        'createdAt': createdAt,
      };

  factory PurchaseBillModel.fromJson(Map<String, dynamic> json) =>
      PurchaseBillModel(
        id: json['id'] ?? '',
        invoiceNumber: json['invoiceNumber'] ?? '',
        supplierId: json['supplierId'] ?? '',
        supplierName: json['supplierName'] ?? '',
        items: (json['items'] as List<dynamic>? ?? [])
            .map((i) => PurchaseBillItem.fromJson(i))
            .toList(),
        totalAmount: (json['totalAmount'] ?? 0).toDouble(),
        paidAmount: (json['paidAmount'] ?? 0).toDouble(),
        status: json['status'] ?? 'paid',
        billDate: json['billDate'] ?? DateTime.now().toIso8601String(),
        createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
      );
}
