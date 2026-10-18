import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../providers/customer_provider.dart';
import '../shared/status_badge.dart';
import 'customer_detail_dialog.dart';
import 'add_customer_dialog.dart';

class CustomerListScreen extends StatelessWidget {
  const CustomerListScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final custProv = context.watch<CustomerProvider>();
    final customers = custProv.filteredCustomers;

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
                            onChanged: (val) => custProv.setSearchQuery(val),
                            style: const TextStyle(fontSize: 13),
                            decoration: const InputDecoration(
                              hintText: 'Search customer by name or phone...',
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
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (_) => const AddCustomerDialog(),
                    );
                  },
                  icon: const Icon(LucideIcons.userPlus, size: 16),
                  label: const Text('Add Customer'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),

          // Customer List
          Expanded(
            child: customers.isEmpty
                ? const Center(
                    child: Text('No customers found', style: TextStyle(color: AppColors.slate400)),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: customers.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final c = customers[index];

                      return InkWell(
                        onTap: () {
                          showDialog(
                            context: context,
                            builder: (_) => CustomerDetailDialog(customer: c),
                          );
                        },
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
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
                                  color: AppColors.primaryMuted,
                                  borderRadius: BorderRadius.circular(10),
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
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          c.name,
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.slate900,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        if (c.creditBalance > 0)
                                          StatusBadge(
                                            label: 'Udhaar: ${Formatters.currency(c.creditBalance)}',
                                            type: BadgeType.danger,
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${c.phone} • ${c.totalOrders} orders • Points: ${c.loyaltyPoints}',
                                      style: const TextStyle(fontSize: 11, color: AppColors.slate500),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(LucideIcons.chevronRight, size: 18, color: AppColors.slate300),
                            ],
                          ),
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
