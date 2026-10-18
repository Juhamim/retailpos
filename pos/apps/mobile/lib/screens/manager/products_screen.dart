import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/product_model.dart';
import '../../providers/product_provider.dart';
import '../shared/status_badge.dart';
import 'product_edit_dialog.dart';

class ProductsScreen extends StatelessWidget {
  const ProductsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final productProv = context.watch<ProductProvider>();
    final products = productProv.filteredProducts;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Search & Action Header
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: AppColors.border, width: 1)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.slate50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        const SizedBox(width: 10),
                        const Icon(LucideIcons.search, size: 16, color: AppColors.slate400),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            onChanged: (val) => productProv.setSearchQuery(val),
                            style: const TextStyle(fontSize: 13),
                            decoration: const InputDecoration(
                              hintText: 'Search product, SKU or Barcode...',
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              contentPadding: EdgeInsets.zero,
                              isDense: true,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (_) => const ProductEditDialog(),
                    );
                  },
                  icon: const Icon(LucideIcons.plusCircle, size: 16),
                  label: const Text('Add Product'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),

          // Products List
          Expanded(
            child: products.isEmpty
                ? const Center(
                    child: Text('No products found', style: TextStyle(color: AppColors.slate400)),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: products.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final p = products[index];

                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        p.name,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.slate900,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      if (p.isOutOfStock)
                                        const StatusBadge(label: 'OUT OF STOCK', type: BadgeType.danger)
                                      else if (p.isLowStock)
                                        StatusBadge(label: 'LOW: ${p.stockQuantity}', type: BadgeType.warning)
                                      else
                                        StatusBadge(label: 'STOCK: ${p.stockQuantity}', type: BadgeType.success),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    '${p.category} • SKU: ${p.sku} • Barcode: ${p.barcode}',
                                    style: const TextStyle(fontSize: 11, color: AppColors.slate500),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Text(
                                        'Cost: ${Formatters.currency(p.costPrice)}  ➔  Sell: ${Formatters.currency(p.sellingPrice)}',
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Margin: +${p.profitMarginPercent.toStringAsFixed(1)}%',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.success,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(LucideIcons.edit, size: 18, color: AppColors.slate600),
                              tooltip: 'Edit Product',
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  builder: (_) => ProductEditDialog(product: p),
                                );
                              },
                            ),
                            IconButton(
                              icon: const Icon(LucideIcons.trash2, size: 18, color: AppColors.danger),
                              tooltip: 'Delete Product',
                              onPressed: () {
                                _confirmDelete(context, p);
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, ProductModel p) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Product', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to remove "${p.name}" from the product catalog?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              context.read<ProductProvider>().deleteProduct(p.id);
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
