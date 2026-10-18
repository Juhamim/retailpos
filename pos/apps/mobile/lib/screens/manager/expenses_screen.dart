import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_enums.dart';
import '../../core/utils/formatters.dart';
import '../../providers/expense_provider.dart';
import '../../providers/auth_provider.dart';
import '../shared/stat_card.dart';

class ExpensesScreen extends StatelessWidget {
  const ExpensesScreen({Key? key}) : super(key: key);

  void _addExpenseModal(BuildContext context) {
    final titleCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    final refCtrl = TextEditingController();
    final noteCtrl = TextEditingController();
    ExpenseCategory selectedCat = ExpenseCategory.rent;
    PaymentMethod selectedPayment = PaymentMethod.cash;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return AlertDialog(
            title: const Text('Record Shop Operating Expense',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Expense Title / Description *')),
                  const SizedBox(height: 10),
                  TextField(
                    controller: amountCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Amount (₹) *', prefixText: '₹ '),
                  ),
                  const SizedBox(height: 14),

                  const Text('Category:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<ExpenseCategory>(
                    value: selectedCat,
                    decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                    items: ExpenseCategory.values.map((cat) {
                      return DropdownMenuItem(value: cat, child: Text(cat.displayName));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setModalState(() => selectedCat = val);
                    },
                  ),
                  const SizedBox(height: 14),

                  const Text('Payment Tender:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    children: [PaymentMethod.cash, PaymentMethod.upi, PaymentMethod.card].map((method) {
                      final isSel = selectedPayment == method;
                      return ChoiceChip(
                        label: Text(method.displayName),
                        selected: isSel,
                        onSelected: (_) => setModalState(() => selectedPayment = method),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),

                  TextField(controller: refCtrl, decoration: const InputDecoration(labelText: 'Receipt / Bill Ref (Optional)')),
                  const SizedBox(height: 10),
                  TextField(controller: noteCtrl, decoration: const InputDecoration(labelText: 'Notes (Optional)')),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                onPressed: () async {
                  final title = titleCtrl.text.trim();
                  final amount = double.tryParse(amountCtrl.text) ?? 0.0;
                  if (title.isEmpty || amount <= 0) return;

                  final auth = context.read<AuthProvider>();
                  final expProv = context.read<ExpenseProvider>();

                  await expProv.addExpense(
                    title: title,
                    category: selectedCat,
                    amount: amount,
                    paymentMethod: selectedPayment,
                    receiptRef: refCtrl.text.trim().isNotEmpty ? refCtrl.text.trim() : null,
                    notes: noteCtrl.text.trim().isNotEmpty ? noteCtrl.text.trim() : null,
                    recordedBy: auth.currentUser?.fullName ?? 'Manager',
                  );

                  if (context.mounted) Navigator.pop(ctx);
                },
                child: const Text('Save Expense'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final expProv = context.watch<ExpenseProvider>();
    final expenses = expProv.expenses;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Action & Stat Card
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    title: 'Total Operating Expenses',
                    value: Formatters.currency(expProv.totalExpenses),
                    subtitle: '${expenses.length} expense records',
                    icon: LucideIcons.receipt,
                    iconColor: AppColors.danger,
                    iconBgColor: AppColors.dangerMuted,
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: () => _addExpenseModal(context),
                  icon: const Icon(LucideIcons.plusCircle, size: 16),
                  label: const Text('Log Expense'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Expense Records List
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
                    'Recent Expense Logs',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.slate900),
                  ),
                  const SizedBox(height: 12),

                  if (expenses.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text('No expenses recorded yet', style: TextStyle(color: AppColors.slate400)),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: expenses.length,
                      separatorBuilder: (_, __) => const Divider(height: 14, color: AppColors.border),
                      itemBuilder: (context, index) {
                        final exp = expenses[index];

                        return Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  exp.title,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.slate900),
                                ),
                                Text(
                                  '${exp.category.displayName} • Paid via ${exp.paymentMethod.displayName} • by ${exp.recordedBy}',
                                  style: const TextStyle(fontSize: 11, color: AppColors.slate500),
                                ),
                                Text(
                                  Formatters.dateTime(exp.date),
                                  style: const TextStyle(fontSize: 10, color: AppColors.slate400),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                Text(
                                  Formatters.currency(exp.amount),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.danger,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                IconButton(
                                  icon: const Icon(LucideIcons.trash2, size: 16, color: AppColors.slate400),
                                  onPressed: () => expProv.deleteExpense(exp.id),
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
          ],
        ),
      ),
    );
  }
}
