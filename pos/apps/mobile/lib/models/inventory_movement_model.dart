enum InventoryMovementType {
  restock,
  damage,
  auditAdjustment,
  sale,
  saleReturn,
}

extension InventoryMovementTypeExtension on InventoryMovementType {
  String get displayName {
    switch (this) {
      case InventoryMovementType.restock:
        return 'Stock In (Restock)';
      case InventoryMovementType.damage:
        return 'Stock Out (Damage/Waste)';
      case InventoryMovementType.auditAdjustment:
        return 'Audit Adjustment';
      case InventoryMovementType.sale:
        return 'POS Sale';
      case InventoryMovementType.saleReturn:
        return 'Customer Return';
    }
  }

  static InventoryMovementType fromString(String val) {
    switch (val.toLowerCase()) {
      case 'restock':
        return InventoryMovementType.restock;
      case 'damage':
        return InventoryMovementType.damage;
      case 'auditadjustment':
      case 'adjustment':
        return InventoryMovementType.auditAdjustment;
      case 'sale':
        return InventoryMovementType.sale;
      case 'salereturn':
      case 'return':
        return InventoryMovementType.saleReturn;
      default:
        return InventoryMovementType.restock;
    }
  }
}

class InventoryMovementModel {
  final String id;
  final String productId;
  final String productName;
  final String sku;
  final InventoryMovementType type;
  final int quantityChanged; // + for In, - for Out
  final int stockAfter;
  final String reason;
  final String performedBy;
  final String timestamp;

  InventoryMovementModel({
    required this.id,
    required this.productId,
    required this.productName,
    required this.sku,
    required this.type,
    required this.quantityChanged,
    required this.stockAfter,
    required this.reason,
    required this.performedBy,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'productId': productId,
        'productName': productName,
        'sku': sku,
        'type': type.name,
        'quantityChanged': quantityChanged,
        'stockAfter': stockAfter,
        'reason': reason,
        'performedBy': performedBy,
        'timestamp': timestamp,
      };

  factory InventoryMovementModel.fromJson(Map<String, dynamic> json) =>
      InventoryMovementModel(
        id: json['id'] ?? '',
        productId: json['productId'] ?? '',
        productName: json['productName'] ?? '',
        sku: json['sku'] ?? '',
        type: InventoryMovementTypeExtension.fromString(json['type'] ?? 'restock'),
        quantityChanged: (json['quantityChanged'] ?? 0).toInt(),
        stockAfter: (json['stockAfter'] ?? 0).toInt(),
        reason: json['reason'] ?? '',
        performedBy: json['performedBy'] ?? 'Manager',
        timestamp: json['timestamp'] ?? DateTime.now().toIso8601String(),
      );
}
