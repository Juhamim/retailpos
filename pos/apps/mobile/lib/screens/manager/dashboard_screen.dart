import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../providers/sales_provider.dart';
import '../../providers/product_provider.dart';
import '../../providers/expense_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../shared/stat_card.dart';
import '../shared/status_badge.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final salesProv = context.watch<SalesProvider>();
    final productProv = context.watch<ProductProvider>();
    final expenseProv = context.watch<ExpenseProvider>();
    final dashProv = context.watch<DashboardProvider>();

    final metrics = dashProv.computeMetrics(
      sales: salesProv.sales,
      products: productProv.products,
      expenses: expenseProv.expenses,
    );

    final isWide = MediaQuery.of(context).size.width >= 700;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Executive POS Dashboard',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.slate900,
                    ),
                  ),
                  Text(
                    'Real-time store performance, profit & inventory alerts',
                    style: TextStyle(fontSize: 12, color: AppColors.slate500),
                  ),
                ],
              ),
              StatusBadge(
                label: 'TODAY: ${Formatters.date(DateTime.now())}',
                type: BadgeType.info,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Primary KPI Cards Grid
          GridView.count(
            crossAxisCount: isWide ? 4 : 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.35,
            children: [
              StatCard(
                title: 'Today Revenue',
                value: Formatters.currency(metrics['grossRevenue']),
                subtitle: '${metrics['ordersCount']} orders completed',
                icon: LucideIcons.dollarSign,
                iconColor: AppColors.primary,
                iconBgColor: AppColors.primaryMuted,
              ),
              StatCard(
                title: 'Est. Net Profit',
                value: Formatters.currency(metrics['netProfitEstimate']),
                subtitle: 'After shop operating costs',
                icon: LucideIcons.trendingUp,
                iconColor: AppColors.success,
                iconBgColor: AppColors.successMuted,
              ),
              StatCard(
                title: 'Low Stock Alerts',
                value: '${metrics['lowStockItems']} items',
                subtitle: '${metrics['outOfStockItems']} items out of stock',
                icon: LucideIcons.alertTriangle,
                iconColor: AppColors.warning,
                iconBgColor: AppColors.warningMuted,
              ),
              StatCard(
                title: 'Today Expenses',
                value: Formatters.currency(metrics['todayExpenses']),
                subtitle: 'Daily store operating costs',
                icon: LucideIcons.receipt,
                iconColor: AppColors.danger,
                iconBgColor: AppColors.dangerMuted,
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Payment Distribution Overview
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
                  'Payment Tender Breakdown',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.slate900),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildPaymentBarItem(
                      'Cash',
                      metrics['cashSales'],
                      metrics['grossRevenue'],
                      const Color(0xFF059669),
                    ),
                    const SizedBox(width: 8),
                    _buildPaymentBarItem(
                      'UPI / QR',
                      metrics['upiSales'],
                      metrics['grossRevenue'],
                      const Color(0xFF2563EB),
                    ),
                    const SizedBox(width: 8),
                    _buildPaymentBarItem(
                      'Card',
                      metrics['cardSales'],
                      metrics['grossRevenue'],
                      const Color(0xFF9333EA),
                    ),
                    const SizedBox(width: 8),
                    _buildPaymentBarItem(
                      'Udhaar Credit',
                      metrics['creditSales'],
                      metrics['grossRevenue'],
                      const Color(0xFFEA580C),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Recent Completed Sales List
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Recent Transactions',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.slate900),
                    ),
                    Text(
                      'Total: ${salesProv.sales.length} bills',
                      style: const TextStyle(fontSize: 11, color: AppColors.slate400),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                if (salesProv.sales.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text('No transactions recorded yet', style: TextStyle(color: AppColors.slate400)),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: salesProv.sales.take(5).length,
                    separatorBuilder: (_, __) => const Divider(height: 14, color: AppColors.border),
                    itemBuilder: (context, index) {
                      final s = salesProv.sales[index];
                      return Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                s.invoiceNumber,
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'monospace',
                                ),
                              ),
                              Text(
                                '${s.customerName} • ${s.items.length} items • ${Formatters.time(s.createdAt)}',
                                style: const TextStyle(fontSize: 11, color: AppColors.slate500),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                Formatters.currency(s.totalAmount),
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.slate900,
                                ),
                              ),
                              StatusBadge(
                                label: s.paymentMethod.displayName,
                                type: BadgeType.neutral,
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
    );
  }

  Widget _buildPaymentBarItem(String label, double amount, double total, Color color) {
    final pct = total > 0 ? ((amount / total) * 100).toStringAsFixed(0) : '0';

    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(Formatters.currency(amount), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
            Text('$pct% of sales', style: const TextStyle(fontSize: 10, color: AppColors.slate400)),
          ],
        ),
      ),
    );
  }
}
