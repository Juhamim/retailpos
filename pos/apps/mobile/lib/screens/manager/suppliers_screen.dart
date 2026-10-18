import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../providers/supplier_provider.dart';

class SuppliersScreen extends StatelessWidget {
  const SuppliersScreen({Key? key}) : super(key: key);

  void _addSupplierModal(BuildContext context) {
    final nameCtrl = TextEditingController();
    final contactCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final gstinCtrl = TextEditingController();
    final balanceCtrl = TextEditingController(text: '0');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Vendor / Supplier', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Supplier / Business Name *')),
              const SizedBox(height: 10),
              TextField(controller: contactCtrl, decoration: const InputDecoration(labelText: 'Contact Person Name')),
              const SizedBox(height: 10),
              TextField(controller: phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone Number *')),
              const SizedBox(height: 10),
              TextField(controller: gstinCtrl, decoration: const InputDecoration(labelText: 'GSTIN Number (Optional)')),
              const SizedBox(height: 10),
              TextField(
                controller: balanceCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Opening Payable Balance (₹)', prefixText: '₹ '),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final name = nameCtrl.text.trim();
              final phone = phoneCtrl.text.trim();
              if (name.isEmpty || phone.isEmpty) return;

              final suppProv = context.read<SupplierProvider>();
              await suppProv.addSupplier(
                name: name,
                contactPerson: contactCtrl.text.trim(),
                phone: phone,
                gstin: gstinCtrl.text.trim().isNotEmpty ? gstinCtrl.text.trim() : null,
                outstandingBalance: double.tryParse(balanceCtrl.text) ?? 0.0,
              );

              if (context.mounted) Navigator.pop(ctx);
            },
            child: const Text('Save Supplier'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final suppProv = context.watch<SupplierProvider>();
    final suppliers = suppProv.filteredSuppliers;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Search & Add Bar
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
                            onChanged: (val) => suppProv.setSearchQuery(val),
                            style: const TextStyle(fontSize: 13),
                            decoration: const InputDecoration(
                              hintText: 'Search supplier name, contact or phone...',
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
                  onPressed: () => _addSupplierModal(context),
                  icon: const Icon(LucideIcons.plusCircle, size: 16),
                  label: const Text('Add Supplier'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),

          // Suppliers List
          Expanded(
            child: suppliers.isEmpty
                ? const Center(
                    child: Text('No suppliers found', style: TextStyle(color: AppColors.slate400)),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: suppliers.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final s = suppliers[index];

                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3E8FF),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              alignment: Alignment.center,
                              child: const Icon(LucideIcons.truck, size: 20, color: Color(0xFF9333EA)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    s.name,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.slate900),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${s.contactPerson.isNotEmpty ? '${s.contactPerson} • ' : ''}${s.phone}',
                                    style: const TextStyle(fontSize: 11, color: AppColors.slate500),
                                  ),
                                  if (s.gstin != null)
                                    Text(
                                      'GSTIN: ${s.gstin}',
                                      style: const TextStyle(fontSize: 10.5, fontFamily: 'monospace', color: AppColors.slate400),
                                    ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('Payable Balance', style: TextStyle(fontSize: 10, color: AppColors.slate400)),
                                Text(
                                  Formatters.currency(s.outstandingBalance),
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                    color: s.outstandingBalance > 0 ? AppColors.danger : AppColors.success,
                                  ),
                                ),
                              ],
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
}
