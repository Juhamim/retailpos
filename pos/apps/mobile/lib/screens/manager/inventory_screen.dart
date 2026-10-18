import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/product_model.dart';
import '../../models/inventory_movement_model.dart';
import '../../providers/product_provider.dart';
import '../../providers/auth_provider.dart';
import '../shared/stat_card.dart';
import '../shared/status_badge.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({Key? key}) : super(key: key);

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  void _openAdjustmentModal(ProductModel product) {
    final qtyCtrl = TextEditingController(text: '10');
    final reasonCtrl = TextEditingController();
    InventoryMovementType selectedType = InventoryMovementType.restock;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return AlertDialog(
            title: Text('Stock Adjustment: ${product.name}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Current Stock: ${product.stockQuantity} ${product.unit}',
                    style: const TextStyle(fontSize: 12, color: AppColors.slate600, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),

                // Movement Type selector
                Wrap(
                  spacing: 6,
                  children: [
                    ChoiceChip(
                      label: const Text('📥 Restock In'),
                      selected: selectedType == InventoryMovementType.restock,
                      onSelected: (_) => setModalState(() => selectedType = InventoryMovementType.restock),
                    ),
                    ChoiceChip(
                      label: const Text('🗑️ Damaged / Waste'),
                      selected: selectedType == InventoryMovementType.damage,
                      onSelected: (_) => setModalState(() => selectedType = InventoryMovementType.damage),
                    ),
                    ChoiceChip(
                      label: const Text('⚖️ Physical Audit Count'),
                      selected: selectedType == InventoryMovementType.auditAdjustment,
                      onSelected: (_) => setModalState(() => selectedType = InventoryMovementType.auditAdjustment),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                TextField(
                  controller: qtyCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: selectedType == InventoryMovementType.auditAdjustment
                        ? 'Actual Counted Stock'
                        : 'Quantity (${selectedType == InventoryMovementType.restock ? '+' : '-'})',
                  ),
                ),
                const SizedBox(height: 10),

                TextField(
                  controller: reasonCtrl,
                  decoration: const InputDecoration(labelText: 'Reason / Memo (e.g. Supplier delivery)'),
                ),
              ],
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                onPressed: () async {
                  final qty = int.tryParse(qtyCtrl.text) ?? 0;
                  final auth = context.read<AuthProvider>();
                  final productProv = context.read<ProductProvider>();

                  if (selectedType == InventoryMovementType.auditAdjustment) {
                    await productProv.recordStockMovement(
                      productId: product.id,
                      type: selectedType,
                      quantityChanged: qty,
                      reason: reasonCtrl.text.trim().isEmpty ? 'Physical Inventory Audit' : reasonCtrl.text.trim(),
                      performedBy: auth.currentUser?.fullName ?? 'Manager',
                      isAuditTarget: true,
                    );
                  } else {
                    final delta = selectedType == InventoryMovementType.restock ? qty : -qty;
                    await productProv.recordStockMovement(
                      productId: product.id,
                      type: selectedType,
                      quantityChanged: delta,
                      reason: reasonCtrl.text.trim().isEmpty
                          ? (selectedType == InventoryMovementType.restock ? 'Supplier Restock' : 'Damaged Goods')
                          : reasonCtrl.text.trim(),
                      performedBy: auth.currentUser?.fullName ?? 'Manager',
                    );
                  }

                  if (mounted) Navigator.pop(ctx);
                },
                child: const Text('Save Adjustment'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final productProv = context.watch<ProductProvider>();
    final products = productProv.products;
    final logs = productProv.inventoryLogs;

    final isWide = MediaQuery.of(context).size.width >= 700;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stock Overview Cards
          GridView.count(
            crossAxisCount: isWide ? 3 : 3,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.5,
            children: [
              StatCard(
                title: 'Total Items',
                value: '${products.length}',
                subtitle: 'Catalog SKUs',
                icon: LucideIcons.package,
              ),
              StatCard(
                title: 'Low Stock',
                value: '${productProv.lowStockCount}',
                subtitle: 'Needs reorder',
                icon: LucideIcons.alertTriangle,
                iconColor: AppColors.warning,
                iconBgColor: AppColors.warningMuted,
              ),
              StatCard(
                title: 'Out of Stock',
                value: '${productProv.outOfStockCount}',
                subtitle: 'Zero stock',
                icon: LucideIcons.alertCircle,
                iconColor: AppColors.danger,
                iconBgColor: AppColors.dangerMuted,
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Stock Items Quick Adjust Table
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Quick Stock Adjustments',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.slate900),
                ),
                const SizedBox(height: 12),

                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: products.length,
                  separatorBuilder: (_, __) => const Divider(height: 12, color: AppColors.border),
                  itemBuilder: (context, index) {
                    final p = products[index];

                    return Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(p.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                              Text('SKU: ${p.sku} • Min alert: ${p.minStockAlert}',
                                  style: const TextStyle(fontSize: 11, color: AppColors.slate500)),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            if (p.isOutOfStock)
                              const StatusBadge(label: 'OUT', type: BadgeType.danger)
                            else if (p.isLowStock)
                              StatusBadge(label: 'LOW: ${p.stockQuantity}', type: BadgeType.warning)
                            else
                              StatusBadge(label: 'QTY: ${p.stockQuantity}', type: BadgeType.success),
                            const SizedBox(width: 8),
                            OutlinedButton.icon(
                              onPressed: () => _openAdjustmentModal(p),
                              icon: const Icon(LucideIcons.slidersHorizontal, size: 14),
                              label: const Text('Adjust'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Audit Ledger Movement Logs
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Inventory Movement Audit Trail',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.slate900),
                ),
                const SizedBox(height: 12),

                if (logs.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text('No inventory movements logged yet', style: TextStyle(color: AppColors.slate400)),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: logs.take(8).length,
                    separatorBuilder: (_, __) => const Divider(height: 12, color: AppColors.border),
                    itemBuilder: (context, index) {
                      final log = logs[index];
                      final isPositive = log.quantityChanged > 0;

                      return Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                log.productName,
                                style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '${log.type.displayName} • ${log.reason} • by ${log.performedBy}',
                                style: const TextStyle(fontSize: 10.5, color: AppColors.slate500),
                              ),
                              Text(
                                Formatters.dateTime(log.timestamp),
                                style: const TextStyle(fontSize: 10, color: AppColors.slate400),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${isPositive ? '+' : ''}${log.quantityChanged}',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: isPositive ? AppColors.success : AppColors.danger,
                                ),
                              ),
                              Text('After: ${log.stockAfter}',
                                  style: const TextStyle(fontSize: 10, color: AppColors.slate500)),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
