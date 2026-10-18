class ProductModel {
  final String id;
  final String name;
  final String sku;
  final String barcode;
  final String category;
  final double costPrice;
  final double sellingPrice;
  final double taxRate; // in % e.g. 5, 12, 18
  final int stockQuantity;
  final int minStockAlert;
  final String unit; // 'pcs', 'kg', 'ltr', 'box'
  final bool isActive;
  final String? imageUrl;
  final String updatedAt;

  ProductModel({
    required this.id,
    required this.name,
    required this.sku,
    required this.barcode,
    required this.category,
    required this.costPrice,
    required this.sellingPrice,
    this.taxRate = 0.0,
    required this.stockQuantity,
    this.minStockAlert = 5,
    this.unit = 'pcs',
    this.isActive = true,
    this.imageUrl,
    required this.updatedAt,
  });

  double get profitMarginPercent {
    if (sellingPrice <= 0) return 0.0;
    return ((sellingPrice - costPrice) / sellingPrice) * 100.0;
  }

  double get profitAmount => sellingPrice - costPrice;

  bool get isLowStock => stockQuantity <= minStockAlert && stockQuantity > 0;
  bool get isOutOfStock => stockQuantity <= 0;

  ProductModel copyWith({
    String? id,
    String? name,
    String? sku,
    String? barcode,
    String? category,
    double? costPrice,
    double? sellingPrice,
    double? taxRate,
    int? stockQuantity,
    int? minStockAlert,
    String? unit,
    bool? isActive,
    String? imageUrl,
    String? updatedAt,
  }) {
    return ProductModel(
      id: id ?? this.id,
      name: name ?? this.name,
      sku: sku ?? this.sku,
      barcode: barcode ?? this.barcode,
      category: category ?? this.category,
      costPrice: costPrice ?? this.costPrice,
      sellingPrice: sellingPrice ?? this.sellingPrice,
      taxRate: taxRate ?? this.taxRate,
      stockQuantity: stockQuantity ?? this.stockQuantity,
      minStockAlert: minStockAlert ?? this.minStockAlert,
      unit: unit ?? this.unit,
      isActive: isActive ?? this.isActive,
      imageUrl: imageUrl ?? this.imageUrl,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'sku': sku,
        'barcode': barcode,
        'category': category,
        'costPrice': costPrice,
        'sellingPrice': sellingPrice,
        'taxRate': taxRate,
        'stockQuantity': stockQuantity,
        'minStockAlert': minStockAlert,
        'unit': unit,
        'isActive': isActive,
        'imageUrl': imageUrl,
        'updatedAt': updatedAt,
      };

  factory ProductModel.fromJson(Map<String, dynamic> json) => ProductModel(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        sku: json['sku'] ?? '',
        barcode: json['barcode'] ?? '',
        category: json['category'] ?? 'General',
        costPrice: (json['costPrice'] ?? 0).toDouble(),
        sellingPrice: (json['sellingPrice'] ?? 0).toDouble(),
        taxRate: (json['taxRate'] ?? 0).toDouble(),
        stockQuantity: (json['stockQuantity'] ?? 0).toInt(),
        minStockAlert: (json['minStockAlert'] ?? 5).toInt(),
        unit: json['unit'] ?? 'pcs',
        isActive: json['isActive'] ?? true,
        imageUrl: json['imageUrl'],
        updatedAt: json['updatedAt'] ?? DateTime.now().toIso8601String(),
      );
}
