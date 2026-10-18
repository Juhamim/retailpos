import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_theme.dart';
import 'core/database/local_storage.dart';
import 'providers/auth_provider.dart';
import 'providers/product_provider.dart';
import 'providers/pos_provider.dart';
import 'providers/shift_provider.dart';
import 'providers/customer_provider.dart';
import 'providers/sales_provider.dart';
import 'providers/supplier_provider.dart';
import 'providers/expense_provider.dart';
import 'providers/dashboard_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/shell/app_shell_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LocalStorage.init();

  runApp(const RetailFlowMobileApp());
}

class RetailFlowMobileApp extends StatelessWidget {
  const RetailFlowMobileApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
        ChangeNotifierProvider(create: (_) => PosProvider()),
        ChangeNotifierProvider(create: (_) => ShiftProvider()),
        ChangeNotifierProvider(create: (_) => CustomerProvider()),
        ChangeNotifierProvider(create: (_) => SalesProvider()),
        ChangeNotifierProvider(create: (_) => SupplierProvider()),
        ChangeNotifierProvider(create: (_) => ExpenseProvider()),
        ChangeNotifierProvider(create: (_) => DashboardProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp(
            title: 'RetailFlow POS',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            home: auth.isLoading
                ? const Scaffold(
                    backgroundColor: Color(0xFF0F172A),
                    body: Center(
                      child: CircularProgressIndicator(color: Color(0xFF6366F1)),
                    ),
                  )
                : (auth.isAuthenticated
                    ? const AppShellScreen()
                    : const LoginScreen()),
          );
        },
      ),
    );
  }
}
