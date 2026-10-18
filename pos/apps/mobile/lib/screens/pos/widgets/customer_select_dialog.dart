import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../providers/customer_provider.dart';
import '../../../providers/pos_provider.dart';
import '../../customers/add_customer_dialog.dart';

class CustomerSelectDialog extends StatefulWidget {
  const CustomerSelectDialog({Key? key}) : super(key: key);

  @override
  State<CustomerSelectDialog> createState() => _CustomerSelectDialogState();
}

class _CustomerSelectDialogState extends State<CustomerSelectDialog> {
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final custProv = context.watch<CustomerProvider>();
    final pos = context.watch<PosProvider>();
    final customers = custProv.filteredCustomers;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 460, maxHeight: 540),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Select Customer',
                    style: TextStyle(
                      fontSize: 16,
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

              // Search Bar & Add New Trigger
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchCtrl,
                      onChanged: (val) => custProv.setSearchQuery(val),
                      decoration: InputDecoration(
                        hintText: 'Search customer name or phone...',
                        prefixIcon: const Icon(LucideIcons.search, size: 16, color: AppColors.slate400),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (_) => const AddCustomerDialog(),
                      );
                    },
                    icon: const Icon(LucideIcons.userPlus, color: AppColors.primary),
                    tooltip: 'Add New Customer',
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Walk-in default selection
              InkWell(
                onTap: () {
                  pos.selectCustomer(null);
                  Navigator.pop(context);
                },
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: pos.selectedCustomer == null
                        ? AppColors.primaryMuted
                        : AppColors.slate50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: pos.selectedCustomer == null
                          ? AppColors.primary
                          : AppColors.border,
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.users, size: 18, color: AppColors.primary),
                      const SizedBox(width: 10),
                      const Text(
                        'Walk-in Customer (General)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.slate900,
                        ),
                      ),
                      const Spacer(),
                      if (pos.selectedCustomer == null)
                        const Icon(LucideIcons.check, size: 16, color: AppColors.primary),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Customer Directory List
              Expanded(
                child: ListView.separated(
                  itemCount: customers.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 6),
                  itemBuilder: (context, index) {
                    final c = customers[index];
                    final isSelected = pos.selectedCustomer?.id == c.id;

                    return InkWell(
                      onTap: () {
                        pos.selectCustomer(c);
                        Navigator.pop(context);
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primaryMuted : Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isSelected ? AppColors.primary : AppColors.border,
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    c.name,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.slate900,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    c.phone,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppColors.slate500,
                                    ),
                                  ),
                                  if (c.creditBalance > 0)
                                    Text(
                                      'Udhaar Due: ${Formatters.currency(c.creditBalance)}',
                                      style: const TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.danger,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              const Icon(LucideIcons.check, size: 16, color: AppColors.primary),
                          ],
                        ),
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
