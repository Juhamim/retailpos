import 'package:flutter/foundation.dart';
import '../../models/cart_item_model.dart';
import '../../models/product_model.dart';
import '../../models/customer_model.dart';

class HeldSaleModel {
  final String id;
  final List<CartItemModel> cart;
  final CustomerModel? customer;
  final double orderDiscount;
  final String note;
  final String heldAt;

  HeldSaleModel({
    required this.id,
    required this.cart,
    this.customer,
    this.orderDiscount = 0.0,
    required this.note,
    required this.heldAt,
  });
}

class PosProvider extends ChangeNotifier {
  final List<CartItemModel> _cart = [];
  CustomerModel? _selectedCustomer;
  double _orderDiscount = 0.0; // In amount e.g. 50.0
  final List<HeldSaleModel> _heldSales = [];
  String _barcodeInput = '';

  List<CartItemModel> get cart => _cart;
  CustomerModel? get selectedCustomer => _selectedCustomer;
  double get orderDiscount => _orderDiscount;
  List<HeldSaleModel> get heldSales => _heldSales;
  String get barcodeInput => _barcodeInput;

  int get cartCount => _cart.fold(0, (sum, item) => sum + item.quantity);

  double get subtotal =>
      _cart.fold(0.0, (sum, item) => sum + item.netSubtotal);

  double get taxAmount => _cart.fold(0.0, (sum, item) => sum + item.taxAmount);

  double get total =>
      (subtotal + taxAmount - _orderDiscount).clamp(0.0, double.infinity);

  void setBarcodeInput(String input) {
    _barcodeInput = input;
    notifyListeners();
  }

  void selectCustomer(CustomerModel? customer) {
    _selectedCustomer = customer;
    notifyListeners();
  }

  void setOrderDiscount(double discount) {
    _orderDiscount = discount.clamp(0.0, subtotal);
    notifyListeners();
  }

  void addToCart(ProductModel product) {
    final idx = _cart.indexWhere((item) => item.product.id == product.id);
    if (idx != -1) {
      _cart[idx].quantity += 1;
    } else {
      _cart.add(CartItemModel(product: product, quantity: 1));
    }
    notifyListeners();
  }

  void updateQuantity(String productId, int delta) {
    final idx = _cart.indexWhere((item) => item.product.id == productId);
    if (idx != -1) {
      final newQty = _cart[idx].quantity + delta;
      if (newQty <= 0) {
        _cart.removeAt(idx);
      } else {
        _cart[idx].quantity = newQty;
      }
      notifyListeners();
    }
  }

  void setItemQuantity(String productId, int quantity) {
    final idx = _cart.indexWhere((item) => item.product.id == productId);
    if (idx != -1) {
      if (quantity <= 0) {
        _cart.removeAt(idx);
      } else {
        _cart[idx].quantity = quantity;
      }
      notifyListeners();
    }
  }

  void setItemDiscount(String productId, double discountPercent) {
    final idx = _cart.indexWhere((item) => item.product.id == productId);
    if (idx != -1) {
      _cart[idx].discountPercent = discountPercent.clamp(0.0, 100.0);
      notifyListeners();
    }
  }

  void removeFromCart(String productId) {
    _cart.removeWhere((item) => item.product.id == productId);
    notifyListeners();
  }

  void clearCart() {
    _cart.clear();
    _selectedCustomer = null;
    _orderDiscount = 0.0;
    _barcodeInput = '';
    notifyListeners();
  }

  /// Hold current cart
  void holdSale(String note) {
    if (_cart.isEmpty) return;
    _heldSales.add(
      HeldSaleModel(
        id: 'held-${DateTime.now().millisecondsSinceEpoch}',
        cart: List.from(_cart),
        customer: _selectedCustomer,
        orderDiscount: _orderDiscount,
        note: note.isEmpty ? 'Order #${_heldSales.length + 1}' : note,
        heldAt: DateTime.now().toIso8601String(),
      ),
    );
    clearCart();
  }

  /// Resume held cart
  void resumeHeldSale(String heldId) {
    final idx = _heldSales.indexWhere((h) => h.id == heldId);
    if (idx != -1) {
      final held = _heldSales.removeAt(idx);
      _cart.clear();
      _cart.addAll(held.cart);
      _selectedCustomer = held.customer;
      _orderDiscount = held.orderDiscount;
      notifyListeners();
    }
  }

  /// Delete held cart
  void deleteHeldSale(String heldId) {
    _heldSales.removeWhere((h) => h.id == heldId);
    notifyListeners();
  }
}
