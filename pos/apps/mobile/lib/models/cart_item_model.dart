import 'product_model.dart';

class CartItemModel {
  final ProductModel product;
  int quantity;
  double discountPercent; // e.g., 5.0 for 5% discount
  double customUnitPrice;

  CartItemModel({
    required this.product,
    this.quantity = 1,
    this.discountPercent = 0.0,
    double? customUnitPrice,
  }) : customUnitPrice = customUnitPrice ?? product.sellingPrice;

  double get unitPrice => customUnitPrice;

  double get grossSubtotal => unitPrice * quantity;

  double get discountAmount => grossSubtotal * (discountPercent / 100.0);

  double get netSubtotal => grossSubtotal - discountAmount;

  double get taxAmount => netSubtotal * (product.taxRate / 100.0);

  double get totalWithTax => netSubtotal + taxAmount;

  Map<String, dynamic> toJson() => {
        'productId': product.id,
        'productName': product.name,
        'sku': product.sku,
        'barcode': product.barcode,
        'unitPrice': unitPrice,
        'quantity': quantity,
        'discountPercent': discountPercent,
        'taxRate': product.taxRate,
        'taxAmount': taxAmount,
        'total': totalWithTax,
      };

  factory CartItemModel.fromJson(Map<String, dynamic> json, ProductModel product) {
    return CartItemModel(
      product: product,
      quantity: (json['quantity'] ?? 1).toInt(),
      discountPercent: (json['discountPercent'] ?? 0).toDouble(),
      customUnitPrice: (json['unitPrice'] ?? product.sellingPrice).toDouble(),
    );
  }
}
