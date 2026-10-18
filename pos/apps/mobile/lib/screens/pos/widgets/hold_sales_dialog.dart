import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../providers/pos_provider.dart';

class HoldSalesDialog extends StatelessWidget {
  const HoldSalesDialog({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final pos = context.watch<PosProvider>();
    final heldList = pos.heldSales;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440, maxHeight: 520),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.clock, size: 20, color: AppColors.warning),
                      const SizedBox(width: 8),
                      Text(
                        'Held Sales Queue (${heldList.length})',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.slate900,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Expanded(
                child: heldList.isEmpty
                    ? const Center(
                        child: Text(
                          'No held sales at the moment',
                          style: TextStyle(color: AppColors.slate400, fontSize: 13),
                        ),
                      )
                    : ListView.separated(
                        itemCount: heldList.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final held = heldList[index];
                          final totalVal = held.cart.fold(0.0, (s, i) => s + i.totalWithTax);

                          return Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.slate50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        held.note,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.slate900,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${held.cart.length} items • ${Formatters.currency(totalVal)}',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: AppColors.slate600,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text(
                                        Formatters.time(held.heldAt),
                                        style: const TextStyle(fontSize: 10, color: AppColors.slate400),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(LucideIcons.playCircle, color: AppColors.success, size: 22),
                                  tooltip: 'Resume Order',
                                  onPressed: () {
                                    pos.resumeHeldSale(held.id);
                                    Navigator.pop(context);
                                  },
                                ),
                                IconButton(
                                  icon: const Icon(LucideIcons.trash2, color: AppColors.danger, size: 18),
                                  tooltip: 'Delete',
                                  onPressed: () => pos.deleteHeldSale(held.id),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
