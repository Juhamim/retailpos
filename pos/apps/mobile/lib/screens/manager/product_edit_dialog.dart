import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../models/product_model.dart';
import '../../providers/product_provider.dart';

class ProductEditDialog extends StatefulWidget {
  final ProductModel? product;

  const ProductEditDialog({Key? key, this.product}) : super(key: key);

  @override
  State<ProductEditDialog> createState() => _ProductEditDialogState();
}

class _ProductEditDialogState extends State<ProductEditDialog> {
  final _nameCtrl = TextEditingController();
  final _skuCtrl = TextEditingController();
  final _barcodeCtrl = TextEditingController();
  final _categoryCtrl = TextEditingController(text: 'General');
  final _costPriceCtrl = TextEditingController(text: '0');
  final _sellPriceCtrl = TextEditingController(text: '0');
  final _taxRateCtrl = TextEditingController(text: '5');
  final _stockCtrl = TextEditingController(text: '20');
  final _minStockCtrl = TextEditingController(text: '5');

  bool get isEditing => widget.product != null;

  @override
  void initState() {
    super.initState();
    if (widget.product != null) {
      final p = widget.product!;
      _nameCtrl.text = p.name;
      _skuCtrl.text = p.sku;
      _barcodeCtrl.text = p.barcode;
      _categoryCtrl.text = p.category;
      _costPriceCtrl.text = p.costPrice.toStringAsFixed(2);
      _sellPriceCtrl.text = p.sellingPrice.toStringAsFixed(2);
      _taxRateCtrl.text = p.taxRate.toStringAsFixed(0);
      _stockCtrl.text = p.stockQuantity.toString();
      _minStockCtrl.text = p.minStockAlert.toString();
    } else {
      _generateAutoSku();
      _generateAutoBarcode();
    }
  }

  void _generateAutoSku() {
    final rand = (1000 + (DateTime.now().millisecondsSinceEpoch % 9000)).toString();
    _skuCtrl.text = 'SKU-$rand';
  }

  void _generateAutoBarcode() {
    final rand = (100000000000 + (DateTime.now().millisecondsSinceEpoch % 900000000000)).toString();
    _barcodeCtrl.text = rand;
  }

  double get _marginPercent {
    final cost = double.tryParse(_costPriceCtrl.text) ?? 0.0;
    final sell = double.tryParse(_sellPriceCtrl.text) ?? 0.0;
    if (sell <= 0) return 0.0;
    return ((sell - cost) / sell) * 100.0;
  }

  void _save() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Product name is required!')),
      );
      return;
    }

    final productProv = context.read<ProductProvider>();
    final cost = double.tryParse(_costPriceCtrl.text) ?? 0.0;
    final sell = double.tryParse(_sellPriceCtrl.text) ?? 0.0;
    final tax = double.tryParse(_taxRateCtrl.text) ?? 0.0;
    final stock = int.tryParse(_stockCtrl.text) ?? 0;
    final minStock = int.tryParse(_minStockCtrl.text) ?? 5;

    if (isEditing) {
      final updated = widget.product!.copyWith(
        name: name,
        sku: _skuCtrl.text.trim(),
        barcode: _barcodeCtrl.text.trim(),
        category: _categoryCtrl.text.trim().isEmpty ? 'General' : _categoryCtrl.text.trim(),
        costPrice: cost,
        sellingPrice: sell,
        taxRate: tax,
        stockQuantity: stock,
        minStockAlert: minStock,
        updatedAt: DateTime.now().toIso8601String(),
      );
      await productProv.updateProduct(updated);
    } else {
      final newProd = ProductModel(
        id: 'prod-${DateTime.now().millisecondsSinceEpoch}',
        name: name,
        sku: _skuCtrl.text.trim(),
        barcode: _barcodeCtrl.text.trim(),
        category: _categoryCtrl.text.trim().isEmpty ? 'General' : _categoryCtrl.text.trim(),
        costPrice: cost,
        sellingPrice: sell,
        taxRate: tax,
        stockQuantity: stock,
        minStockAlert: minStock,
        updatedAt: DateTime.now().toIso8601String(),
      );
      await productProv.addProduct(newProd);
    }

    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480, maxHeight: 620),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isEditing ? 'Edit Product' : 'Add New Product',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x, size: 18),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Name
                TextField(
                  controller: _nameCtrl,
                  decoration: const InputDecoration(labelText: 'Product Name *'),
                ),
                const SizedBox(height: 10),

                // SKU & Barcode with auto generate buttons
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _skuCtrl,
                        decoration: InputDecoration(
                          labelText: 'SKU Code',
                          suffixIcon: IconButton(
                            icon: const Icon(LucideIcons.refreshCw, size: 14),
                            tooltip: 'Auto Generate SKU',
                            onPressed: _generateAutoSku,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _barcodeCtrl,
                        decoration: InputDecoration(
                          labelText: 'Barcode',
                          suffixIcon: IconButton(
                            icon: const Icon(LucideIcons.scan, size: 14),
                            tooltip: 'Auto Generate Barcode',
                            onPressed: _generateAutoBarcode,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Category
                TextField(
                  controller: _categoryCtrl,
                  decoration: const InputDecoration(labelText: 'Category'),
                ),
                const SizedBox(height: 10),

                // Cost & Sell Prices
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _costPriceCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(
                          labelText: 'Cost Price (₹)',
                          prefixText: '₹ ',
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _sellPriceCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(
                          labelText: 'Selling Price (₹)',
                          prefixText: '₹ ',
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // Live Margin preview
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.slate50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Calculated Profit Margin:', style: TextStyle(fontSize: 11, color: AppColors.slate500)),
                      Text(
                        '+${_marginPercent.toStringAsFixed(1)}%',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.success),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Tax Rate & Stock
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _taxRateCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(
                          labelText: 'GST Tax (%)',
                          suffixText: '%',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _stockCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Current Stock Qty'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _minStockCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Min Alert Qty'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _save,
                        child: Text(isEditing ? 'Update Product' : 'Save Product'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
