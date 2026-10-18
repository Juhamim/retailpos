import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/printing/thermal_printer_service.dart';
import '../../../models/sale_model.dart';

class ReceiptDialog extends StatelessWidget {
  final SaleModel sale;
  final VoidCallback onNewSale;

  const ReceiptDialog({
    Key? key,
    required this.sale,
    required this.onNewSale,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Success Header
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.successMuted,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.successBorder),
                ),
                child: const Icon(LucideIcons.checkCheck, color: AppColors.success, size: 28),
              ),
              const SizedBox(height: 12),
              const Text(
                'Payment Received!',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.slate900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Invoice: ${sale.invoiceNumber}',
                style: const TextStyle(
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: AppColors.slate500,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              // Receipt Summary Paper View
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.slate50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Customer', style: TextStyle(fontSize: 11, color: AppColors.slate500)),
                        Text(sale.customerName, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Items Sold', style: TextStyle(fontSize: 11, color: AppColors.slate500)),
                        Text('${sale.items.length} items', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Primary Payment', style: TextStyle(fontSize: 11, color: AppColors.slate500)),
                        Text(sale.paymentMethod.displayName, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const Divider(height: 14, color: AppColors.border),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Net Paid Total', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        Text(
                          Formatters.currency(sale.totalAmount),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primaryDark,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Action Buttons: Print Thermal / PDF / New Sale
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => ThermalPrinterService.printReceipt(sale),
                      icon: const Icon(LucideIcons.printer, size: 16),
                      label: const Text('Print 80mm'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        onNewSale();
                      },
                      icon: const Icon(LucideIcons.plusCircle, size: 16, color: Colors.white),
                      label: const Text(
                        'New Sale',
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
