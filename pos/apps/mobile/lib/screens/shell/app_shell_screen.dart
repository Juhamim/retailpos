import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/shift_provider.dart';
import '../pos/pos_screen.dart';
import '../shifts/shift_management_screen.dart';
import '../customers/customer_list_screen.dart';
import '../returns/sales_returns_screen.dart';
import '../manager/dashboard_screen.dart';
import '../manager/products_screen.dart';
import '../manager/inventory_screen.dart';
import '../manager/barcode_labels_screen.dart';
import '../manager/suppliers_screen.dart';
import '../manager/expenses_screen.dart';
import '../manager/reports_screen.dart';
import '../auth/login_screen.dart';

class AppShellScreen extends StatefulWidget {
  const AppShellScreen({Key? key}) : super(key: key);

  @override
  State<AppShellScreen> createState() => _AppShellScreenState();
}

class _AppShellScreenState extends State<AppShellScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final shift = context.watch<ShiftProvider>();
    final isManager = auth.isManager;
    final currentUser = auth.currentUser;

    // Define Role-aware navigation menu items
    final List<NavItem> navItems = [
      if (isManager)
        NavItem(
          title: 'Dashboard',
          icon: LucideIcons.layoutDashboard,
          widget: const DashboardScreen(),
        ),
      NavItem(
        title: 'POS Terminal',
        icon: LucideIcons.shoppingCart,
        widget: const PosScreen(),
      ),
      if (isManager)
        NavItem(
          title: 'Products',
          icon: LucideIcons.package,
          widget: const ProductsScreen(),
        ),
      if (isManager)
        NavItem(
          title: 'Inventory',
          icon: LucideIcons.warehouse,
          widget: const InventoryScreen(),
        ),
      NavItem(
        title: 'Customers',
        icon: LucideIcons.users,
        widget: const CustomerListScreen(),
      ),
      NavItem(
        title: 'Register Shifts',
        icon: LucideIcons.key,
        widget: const ShiftManagementScreen(),
      ),
      NavItem(
        title: 'Sales Returns',
        icon: LucideIcons.arrowLeftRight,
        widget: const SalesReturnsScreen(),
      ),
      if (isManager) ...[
        NavItem(
          title: 'Print Barcodes',
          icon: LucideIcons.qrCode,
          widget: const BarcodeLabelsScreen(),
        ),
        NavItem(
          title: 'Suppliers',
          icon: LucideIcons.truck,
          widget: const SuppliersScreen(),
        ),
        NavItem(
          title: 'Expenses',
          icon: LucideIcons.receipt,
          widget: const ExpensesScreen(),
        ),
        NavItem(
          title: 'Reports & GST',
          icon: LucideIcons.barChart3,
          widget: const ReportsScreen(),
        ),
      ],
    ];

    if (_selectedIndex >= navItems.length) {
      _selectedIndex = 0;
    }

    final currentNavItem = navItems[_selectedIndex];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            Text(currentNavItem.title),
            const SizedBox(width: 10),
            // Role Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: isManager
                    ? const Color(0xFF9333EA).withOpacity(0.2)
                    : AppColors.primary.withOpacity(0.2),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: isManager
                      ? const Color(0xFFC084FC)
                      : AppColors.primaryLight,
                  width: 0.8,
                ),
              ),
              child: Text(
                currentUser?.role.displayName.toUpperCase() ?? 'STAFF',
                style: TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.bold,
                  color: isManager
                      ? const Color(0xFFE9D5FF)
                      : AppColors.primaryLight,
                ),
              ),
            ),
          ],
        ),
        actions: [
          // Shift Status indicator button
          TextButton.icon(
            onPressed: () {
              final shiftIdx =
                  navItems.indexWhere((item) => item.title == 'Register Shifts');
              if (shiftIdx != -1) {
                setState(() => _selectedIndex = shiftIdx);
              }
            },
            icon: Icon(
              shift.hasActiveShift
                  ? LucideIcons.checkCircle2
                  : LucideIcons.alertTriangle,
              size: 14,
              color: shift.hasActiveShift
                  ? AppColors.success
                  : AppColors.warning,
            ),
            label: Text(
              shift.hasActiveShift ? 'Shift Open' : 'Shift Closed',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: shift.hasActiveShift
                    ? AppColors.success
                    : AppColors.warning,
              ),
            ),
          ),
          // Logout / Lock Terminal
          IconButton(
            icon: const Icon(LucideIcons.lock, size: 18),
            tooltip: 'Lock Terminal / Logout',
            onPressed: () async {
              await auth.logout();
              if (mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      drawer: _buildAppDrawer(context, navItems, auth, isManager),
      body: currentNavItem.widget,
    );
  }

  Widget _buildAppDrawer(BuildContext context, List<NavItem> items,
      AuthProvider auth, bool isManager) {
    final user = auth.currentUser;

    return Drawer(
      backgroundColor: AppColors.slate950,
      child: SafeArea(
        child: Column(
          children: [
            // Drawer Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: AppColors.slate800, width: 1),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, Color(0xFF9333EA)],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      user?.initials ?? 'RF',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.fullName ?? 'Staff Member',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.role.displayName ?? 'Cashier',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.primaryLight,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Navigation List Items
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 4),
                itemBuilder: (context, index) {
                  final item = items[index];
                  final isSelected = _selectedIndex == index;

                  return ListTile(
                    dense: true,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    tileColor: isSelected
                        ? AppColors.primary
                        : Colors.transparent,
                    leading: Icon(
                      item.icon,
                      size: 20,
                      color: isSelected ? Colors.white : AppColors.slate400,
                    ),
                    title: Text(
                      item.title,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.w500,
                        color: isSelected ? Colors.white : AppColors.slate300,
                      ),
                    ),
                    onTap: () {
                      setState(() => _selectedIndex = index);
                      Navigator.pop(context); // close drawer
                    },
                  );
                },
              ),
            ),

            // Footer lock
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                border: Border(
                  top: BorderSide(color: AppColors.slate800, width: 1),
                ),
              ),
              child: InkWell(
                onTap: () async {
                  await auth.logout();
                  if (mounted) {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  }
                },
                child: const Row(
                  children: [
                    Icon(LucideIcons.logOut, size: 18, color: AppColors.danger),
                    SizedBox(width: 12),
                    Text(
                      'Lock & Sign Out',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.danger,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class NavItem {
  final String title;
  final IconData icon;
  final Widget widget;

  NavItem({
    required this.title,
    required this.icon,
    required this.widget,
  });
}
