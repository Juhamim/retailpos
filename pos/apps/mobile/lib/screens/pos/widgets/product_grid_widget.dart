import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/audio_helper.dart';
import '../../../models/product_model.dart';
import '../../../providers/product_provider.dart';
import '../../../providers/pos_provider.dart';
import '../../shared/status_badge.dart';

class ProductGridWidget extends StatelessWidget {
  const ProductGridWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final productProv = context.watch<ProductProvider>();
    final posProv = context.watch<PosProvider>();
    final products = productProv.filteredProducts;
    final categories = productProv.categories;

    return Column(
      children: [
        // Category Chips Row
        Container(
          height: 44,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final cat = categories[index];
              final isSelected = productProv.selectedCategory == cat;

              return ChoiceChip(
                label: Text(cat),
                selected: isSelected,
                onSelected: (_) => productProv.setCategory(cat),
                labelStyle: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? Colors.white : AppColors.slate700,
                ),
                selectedColor: AppColors.primary,
                backgroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide(
                    color: isSelected ? AppColors.primary : AppColors.border,
                  ),
                ),
                showCheckmark: false,
              );
            },
          ),
        ),
        const SizedBox(height: 8),

        // Product Catalog Grid
        Expanded(
          child: products.isEmpty
              ? _buildEmptyState()
              : GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate:
                      const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 180,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.85,
                  ),
                  itemCount: products.length,
                  itemBuilder: (context, index) {
                    final product = products[index];
                    return _buildProductCard(context, product, posProv);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildProductCard(
      BuildContext context, ProductModel product, PosProvider posProv) {
    return InkWell(
      onTap: () {
        if (product.stockQuantity <= 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Warning: "${product.name}" is out of stock!'),
              backgroundColor: AppColors.danger,
              duration: const Duration(seconds: 1),
            ),
          );
        }
        posProv.addToCart(product);
        AudioHelper.playBeep();
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Category & Stock Status Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    product.category,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppColors.slate400,
                    ),
                  ),
                ),
                if (product.isOutOfStock)
                  const StatusBadge(label: 'Out', type: BadgeType.danger)
                else if (product.isLowStock)
                  StatusBadge(label: '${product.stockQuantity}', type: BadgeType.warning)
                else
                  StatusBadge(label: '${product.stockQuantity}', type: BadgeType.success),
              ],
            ),
            const Spacer(),

            // Product Name
            Text(
              product.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.slate900,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 4),

            // SKU & Margin
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  product.sku,
                  style: const TextStyle(
                    fontSize: 10,
                    fontFamily: 'monospace',
                    color: AppColors.slate400,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '+${product.profitMarginPercent.toStringAsFixed(0)}%',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: AppColors.success,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Price & Add Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  Formatters.currency(product.sellingPrice),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.slate900,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppColors.primaryMuted,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    LucideIcons.plus,
                    size: 14,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.searchX, size: 40, color: AppColors.slate300),
          SizedBox(height: 12),
          Text(
            'No matching products found',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: AppColors.slate500,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Try searching a different keyword or barcode',
            style: TextStyle(fontSize: 12, color: AppColors.slate400),
          ),
        ],
      ),
    );
  }
}
