import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/printing/thermal_printer_service.dart';
import '../../providers/shift_provider.dart';
import '../../providers/auth_provider.dart';
import '../shared/stat_card.dart';
import '../shared/status_badge.dart';

class ShiftManagementScreen extends StatefulWidget {
  const ShiftManagementScreen({Key? key}) : super(key: key);

  @override
  State<ShiftManagementScreen> createState() => _ShiftManagementScreenState();
}

class _ShiftManagementScreenState extends State<ShiftManagementScreen> {
  void _openShiftModal() {
    final floatCtrl = TextEditingController(text: '1000');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Open Register Shift', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter the initial cash drawer float counted in the till:',
              style: TextStyle(fontSize: 12, color: AppColors.slate600),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: floatCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Opening Cash Float (₹)',
                prefixText: '₹ ',
              ),
              autofocus: true,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final auth = context.read<AuthProvider>();
              final shift = context.read<ShiftProvider>();
              final float = double.tryParse(floatCtrl.text) ?? 0.0;

              await shift.openShift(
                cashierId: auth.currentUser?.id ?? 'cashier-1',
                cashierName: auth.currentUser?.fullName ?? 'Cashier',
                openingCash: float,
              );

              if (mounted) Navigator.pop(ctx);
            },
            child: const Text('Start Shift'),
          ),
        ],
      ),
    );
  }

  void _addCashMovementModal(String type) {
    final isDrop = type == 'cash_out';
    final amountCtrl = TextEditingController();
    final reasonCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isDrop ? 'Cash Drop / Pay Out' : 'Cash In / Add Float',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: amountCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Amount (₹)',
                prefixText: '₹ ',
              ),
              autofocus: true,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              decoration: InputDecoration(
                labelText: 'Reason / Memo',
                hintText: isDrop ? 'e.g. Bank deposit or petty cash' : 'e.g. Added change coins',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final shift = context.read<ShiftProvider>();
              final amount = double.tryParse(amountCtrl.text) ?? 0.0;
              if (amount > 0) {
                await shift.addShiftMovement(
                  type: type,
                  amount: amount,
                  reason: reasonCtrl.text.trim().isEmpty ? (isDrop ? 'Cash Drop' : 'Cash In') : reasonCtrl.text.trim(),
                );
              }
              if (mounted) Navigator.pop(ctx);
            },
            child: const Text('Save Record'),
          ),
        ],
      ),
    );
  }

  void _closeShiftModal() {
    final shift = context.read<ShiftProvider>();
    final active = shift.activeShift;
    if (active == null) return;

    final actualCtrl = TextEditingController(
      text: active.expectedCashInDrawer.toStringAsFixed(2),
    );
    final noteCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Close Shift & Print Z-Report',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.slate900,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Expected Cash in Till:',
                        style: TextStyle(color: AppColors.slate400, fontSize: 12)),
                    Text(
                      Formatters.currency(active.expectedCashInDrawer),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: actualCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Actual Counted Cash in Drawer (₹)',
                  prefixText: '₹ ',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: noteCtrl,
                decoration: const InputDecoration(
                  labelText: 'Shift Closing Notes (Optional)',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final actual = double.tryParse(actualCtrl.text) ?? 0.0;
              final closed = await shift.closeShift(
                closingCashActual: actual,
                notes: noteCtrl.text.trim(),
              );

              if (mounted) {
                Navigator.pop(ctx);
                if (closed != null) {
                  await ThermalPrinterService.printZReport(closed);
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Close & Print Z-Report'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final shift = context.watch<ShiftProvider>();
    final active = shift.activeShift;
    final past = shift.pastShifts;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Current Shift Status Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          active != null ? 'ACTIVE REGISTER SHIFT' : 'NO ACTIVE SHIFT',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1,
                            color: AppColors.slate500,
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (active != null)
                          const StatusBadge(label: 'OPEN', type: BadgeType.success)
                        else
                          const StatusBadge(label: 'CLOSED', type: BadgeType.danger),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      active != null
                          ? 'Cashier: ${active.cashierName}'
                          : 'Please open register shift to begin checkout operations',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.slate900,
                      ),
                    ),
                    if (active != null)
                      Text(
                        'Opened at ${Formatters.time(active.startTime)} • Float: ${Formatters.currency(active.openingCash)}',
                        style: const TextStyle(fontSize: 11, color: AppColors.slate400),
                      ),
                  ],
                ),
                if (active == null)
                  ElevatedButton.icon(
                    onPressed: _openShiftModal,
                    icon: const Icon(LucideIcons.playCircle, size: 16),
                    label: const Text('Open Shift'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                  )
                else
                  ElevatedButton.icon(
                    onPressed: _closeShiftModal,
                    icon: const Icon(LucideIcons.stopCircle, size: 16),
                    label: const Text('Close Shift'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Active Shift KPI Cards
          if (active != null) ...[
            GridView.count(
              crossAxisCount: MediaQuery.of(context).size.width >= 700 ? 4 : 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.4,
              children: [
                StatCard(
                  title: 'Expected Cash in Till',
                  value: Formatters.currency(active.expectedCashInDrawer),
                  subtitle: 'Float + Cash Sales',
                  icon: LucideIcons.banknote,
                  iconColor: AppColors.success,
                  iconBgColor: AppColors.successMuted,
                ),
                StatCard(
                  title: 'Total Shift Sales',
                  value: Formatters.currency(active.totalGrossSales),
                  subtitle: '${active.totalTransactions} transactions',
                  icon: LucideIcons.shoppingBag,
                  iconColor: AppColors.primary,
                  iconBgColor: AppColors.primaryMuted,
                ),
                StatCard(
                  title: 'UPI / QR Payments',
                  value: Formatters.currency(active.totalUpiSales),
                  subtitle: 'Direct digital pay',
                  icon: LucideIcons.qrCode,
                  iconColor: const Color(0xFF2563EB),
                  iconBgColor: const Color(0xFFEFF6FF),
                ),
                StatCard(
                  title: 'Card & Store Credit',
                  value: Formatters.currency(active.totalCardSales + active.totalCreditSales),
                  subtitle: 'Card + Udhaar bills',
                  icon: LucideIcons.creditCard,
                  iconColor: const Color(0xFF9333EA),
                  iconBgColor: const Color(0xFFFAF5FF),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Mid-Day Drawer In/Out Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _addCashMovementModal('cash_in'),
                    icon: const Icon(LucideIcons.arrowDownCircle, color: AppColors.success, size: 18),
                    label: const Text('Add Cash Float In'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _addCashMovementModal('cash_out'),
                    icon: const Icon(LucideIcons.arrowUpCircle, color: AppColors.danger, size: 18),
                    label: const Text('Cash Drop / Payout'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],

          // Past Shifts Z-Reports History
          const Text(
            'Past Shift Z-Reports History',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.slate900),
          ),
          const SizedBox(height: 12),

          if (past.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: const Text('No past closed shift reports yet', style: TextStyle(color: AppColors.slate400)),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: past.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = past[index];
                final isBalanced = (item.variance ?? 0).abs() < 1;

                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                item.cashierName,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              const SizedBox(width: 8),
                              StatusBadge(
                                label: isBalanced ? 'BALANCED' : 'VARIANCE',
                                type: isBalanced ? BadgeType.success : BadgeType.danger,
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Started: ${Formatters.dateTime(item.startTime)}',
                            style: const TextStyle(fontSize: 11, color: AppColors.slate400),
                          ),
                          Text(
                            'Gross Sales: ${Formatters.currency(item.totalGrossSales)} (${item.totalTransactions} bills)',
                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.printer, size: 20, color: AppColors.slate700),
                        tooltip: 'Reprint Z-Report',
                        onPressed: () => ThermalPrinterService.printZReport(item),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
