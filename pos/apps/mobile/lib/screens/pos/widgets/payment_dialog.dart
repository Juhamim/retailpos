import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_enums.dart';
import '../../../core/utils/formatters.dart';
import '../../../models/sale_model.dart';

class PaymentDialog extends StatefulWidget {
  final double totalAmount;
  final String? customerName;
  final double customerCreditBalance;
  final Function(List<PaymentRecord>) onComplete;

  const PaymentDialog({
    Key? key,
    required this.totalAmount,
    this.customerName,
    this.customerCreditBalance = 0.0,
    required this.onComplete,
  }) : super(key: key);

  @override
  State<PaymentDialog> createState() => _PaymentDialogState();
}

class _PaymentDialogState extends State<PaymentDialog> {
  PaymentMethod _selectedMethod = PaymentMethod.cash;
  final TextEditingController _amountController = TextEditingController();
  final List<PaymentRecord> _payments = [];
  double _cashTendered = 0.0;

  @override
  void initState() {
    super.initState();
    _amountController.text = widget.totalAmount.toStringAsFixed(2);
    _cashTendered = widget.totalAmount;
  }

  double get _totalPaid =>
      _payments.fold(0.0, (sum, p) => sum + p.amount);

  double get _remainingBalance =>
      (widget.totalAmount - _totalPaid).clamp(0.0, double.infinity);

  double get _changeDue =>
      (_cashTendered - (_selectedAmount)).clamp(0.0, double.infinity);

  double get _selectedAmount =>
      double.tryParse(_amountController.text) ?? 0.0;

  void _addPayment() {
    final amount = _selectedAmount;
    if (amount <= 0) return;

    final actualToAdd = amount > _remainingBalance ? _remainingBalance : amount;

    setState(() {
      _payments.add(
        PaymentRecord(
          method: _selectedMethod,
          amount: actualToAdd,
        ),
      );
      final newRemaining = _remainingBalance;
      _amountController.text = newRemaining.toStringAsFixed(2);
      _cashTendered = newRemaining;
    });

    if (_remainingBalance <= 0) {
      widget.onComplete(_payments);
    }
  }

  void _completeSingleTender() {
    final payments = [
      PaymentRecord(
        method: _selectedMethod,
        amount: widget.totalAmount,
      )
    ];
    widget.onComplete(payments);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 460),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Complete Payment',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.slate900,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Total Payable Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.slate900,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'TOTAL PAYABLE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.slate400,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          Formatters.currency(widget.totalAmount),
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    if (_remainingBalance < widget.totalAmount)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text(
                            'REMAINING',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppColors.warning,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            Formatters.currency(_remainingBalance),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.warning,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Payment Methods Grid
              const Text(
                'Select Payment Method',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppColors.slate700,
                ),
              ),
              const SizedBox(height: 8),

              Row(
                children: [
                  _buildMethodChip(PaymentMethod.cash, '💵 Cash', LucideIcons.banknote),
                  const SizedBox(width: 8),
                  _buildMethodChip(PaymentMethod.upi, '📱 UPI QR', LucideIcons.qrCode),
                  const SizedBox(width: 8),
                  _buildMethodChip(PaymentMethod.card, '💳 Card', LucideIcons.creditCard),
                  const SizedBox(width: 8),
                  _buildMethodChip(PaymentMethod.credit, '📒 Khata', LucideIcons.bookOpen),
                ],
              ),
              const SizedBox(height: 16),

              // Tender Amount Input
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _amountController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      decoration: InputDecoration(
                        labelText: 'Tender Amount (₹)',
                        prefixText: '₹ ',
                        suffixIcon: IconButton(
                          icon: const Icon(LucideIcons.checkCircle2, size: 16, color: AppColors.primary),
                          tooltip: 'Fill Balance',
                          onPressed: () {
                            _amountController.text = _remainingBalance.toStringAsFixed(2);
                          },
                        ),
                      ),
                      onChanged: (val) {
                        setState(() {
                          _cashTendered = double.tryParse(val) ?? 0.0;
                        });
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              if (_selectedMethod == PaymentMethod.cash && _changeDue > 0)
                Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.successMuted,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.successBorder),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Change Due to Customer:',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF047857))),
                      Text(Formatters.currency(_changeDue),
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF047857))),
                    ],
                  ),
                ),

              // Fast Cash Preset Buttons (if Cash selected)
              if (_selectedMethod == PaymentMethod.cash)
                Wrap(
                  spacing: 6,
                  children: [100, 200, 500, 1000, 2000].map((denom) {
                    return ActionChip(
                      label: Text('+₹$denom'),
                      labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                      backgroundColor: AppColors.slate100,
                      onPressed: () {
                        setState(() {
                          final cur = double.tryParse(_amountController.text) ?? 0.0;
                          final next = cur + denom;
                          _amountController.text = next.toStringAsFixed(2);
                          _cashTendered = next;
                        });
                      },
                    );
                  }).toList(),
                ),

              if (_payments.isNotEmpty) ...[
                const SizedBox(height: 12),
                const Text(
                  'Applied Tenders:',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slate500),
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 6,
                  children: _payments.map((p) {
                    return Chip(
                      label: Text('${p.method.displayName}: ${Formatters.currency(p.amount)}'),
                      labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                      deleteIcon: const Icon(LucideIcons.x, size: 12),
                      onDeleted: () {
                        setState(() {
                          _payments.remove(p);
                          _amountController.text = _remainingBalance.toStringAsFixed(2);
                        });
                      },
                    );
                  }).toList(),
                ),
              ],

              const SizedBox(height: 20),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        if (_payments.isEmpty) {
                          _completeSingleTender();
                        } else {
                          _addPayment();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text(
                        'Complete Sale',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
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

  Widget _buildMethodChip(PaymentMethod method, String label, IconData icon) {
    final isSelected = _selectedMethod == method;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedMethod = method),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.border,
            ),
          ),
          alignment: Alignment.center,
          child: Column(
            children: [
              Icon(
                icon,
                size: 16,
                color: isSelected ? Colors.white : AppColors.slate700,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  color: isSelected ? Colors.white : AppColors.slate700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
