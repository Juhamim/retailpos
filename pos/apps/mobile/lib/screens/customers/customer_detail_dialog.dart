import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/customer_model.dart';
import '../../providers/customer_provider.dart';

class CustomerDetailDialog extends StatefulWidget {
  final CustomerModel customer;

  const CustomerDetailDialog({Key? key, required this.customer}) : super(key: key);

  @override
  State<CustomerDetailDialog> createState() => _CustomerDetailDialogState();
}

class _CustomerDetailDialogState extends State<CustomerDetailDialog> {
  void _settlePaymentModal(BuildContext context) {
    final amountCtrl = TextEditingController(
      text: widget.customer.creditBalance.toStringAsFixed(2),
    );
    final descCtrl = TextEditingController(text: 'Khata Cash Settlement');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Record Udhaar Balance Payment',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: amountCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Payment Amount (₹)',
                prefixText: '₹ ',
              ),
              autofocus: true,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descCtrl,
              decoration: const InputDecoration(labelText: 'Note / Memo'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final custProv = context.read<CustomerProvider>();
              final amount = double.tryParse(amountCtrl.text) ?? 0.0;
              if (amount > 0) {
                await custProv.recordCreditTransaction(
                  customerId: widget.customer.id,
                  type: 'payment',
                  amount: amount,
                  description: descCtrl.text.trim(),
                );
              }
              if (mounted) {
                Navigator.pop(ctx);
                Navigator.pop(context);
              }
            },
            child: const Text('Confirm Settle'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.customer;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480, maxHeight: 600),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.primaryMuted,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          c.name.isNotEmpty ? c.name[0].toUpperCase() : 'C',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            c.name,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          Text(c.phone, style: const TextStyle(fontSize: 11, color: AppColors.slate500)),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // KPI Stats
              Row(
                children: [
                  _buildMiniStat('Total Spent', Formatters.currency(c.totalSpent)),
                  const SizedBox(width: 8),
                  _buildMiniStat('Orders', '${c.totalOrders} bills'),
                  const SizedBox(width: 8),
                  _buildMiniStat('Loyalty Pts', '${c.loyaltyPoints} pts'),
                ],
              ),
              const SizedBox(height: 16),

              // Outstanding Udhaar Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: c.creditBalance > 0 ? AppColors.dangerMuted : AppColors.successMuted,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: c.creditBalance > 0 ? AppColors.dangerBorder : AppColors.successBorder,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          c.creditBalance > 0 ? 'OUTSTANDING STORE CREDIT (UDHAAR)' : 'NO OUTSTANDING BALANCE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: c.creditBalance > 0 ? AppColors.danger : AppColors.success,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          Formatters.currency(c.creditBalance),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: c.creditBalance > 0 ? AppColors.danger : AppColors.success,
                          ),
                        ),
                      ],
                    ),
                    if (c.creditBalance > 0)
                      ElevatedButton(
                        onPressed: () => _settlePaymentModal(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.danger,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('Settle / Pay', style: TextStyle(fontSize: 12, color: Colors.white)),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Ledger History
              const Text(
                'Khata Credit / Payment History',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.slate900),
              ),
              const SizedBox(height: 8),

              Expanded(
                child: c.ledger.isEmpty
                    ? const Center(
                        child: Text('No credit ledger transactions recorded yet',
                            style: TextStyle(fontSize: 12, color: AppColors.slate400)),
                      )
                    : ListView.separated(
                        itemCount: c.ledger.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 6),
                        itemBuilder: (context, index) {
                          final entry = c.ledger[index];
                          final isCharge = entry.type == 'charge';

                          return Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.slate50,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      entry.description,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                    Text(
                                      Formatters.dateTime(entry.date),
                                      style: const TextStyle(fontSize: 10, color: AppColors.slate400),
                                    ),
                                  ],
                                ),
                                Text(
                                  '${isCharge ? '+' : '-'} ${Formatters.currency(entry.amount)}',
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.bold,
                                    color: isCharge ? AppColors.danger : AppColors.success,
                                  ),
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

  Widget _buildMiniStat(String label, String val) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppColors.slate50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10, color: AppColors.slate400)),
            const SizedBox(height: 2),
            Text(val, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
