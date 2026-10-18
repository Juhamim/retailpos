import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../shell/app_shell_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String _pin = '';
  bool _usePasswordMode = false;
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _errorMessage;
  bool _isLoading = false;

  void _handleKeypadPress(String val) {
    if (_pin.length < 4) {
      setState(() {
        _pin += val;
        _errorMessage = null;
      });

      if (_pin.length == 4) {
        _attemptPinLogin(_pin);
      }
    }
  }

  void _handleBackspace() {
    if (_pin.isNotEmpty) {
      setState(() {
        _pin = _pin.substring(0, _pin.length - 1);
        _errorMessage = null;
      });
    }
  }

  Future<void> _attemptPinLogin(String pin) async {
    setState(() => _isLoading = true);
    final auth = context.read<AuthProvider>();
    final success = await auth.loginWithPin(pin);

    setState(() => _isLoading = false);

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AppShellScreen()),
      );
    } else if (mounted) {
      setState(() {
        _pin = '';
        _errorMessage = 'Invalid PIN. Try "1111" (Cashier) or "1234" (Manager)';
      });
    }
  }

  Future<void> _attemptPasswordLogin() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please enter username and password');
      return;
    }

    setState(() => _isLoading = true);
    final auth = context.read<AuthProvider>();
    final success = await auth.loginWithCredentials(username, password);
    setState(() => _isLoading = false);

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AppShellScreen()),
      );
    } else if (mounted) {
      setState(() => _errorMessage = 'Invalid username or password');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate950,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // App Brand Logo & Title
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF9333EA)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF6366F1).withOpacity(0.35),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(
                      LucideIcons.shoppingCart,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'RetailFlow POS',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Point of Sale Terminal (Android)',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.slate400,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Login Mode Switcher
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColors.slate900,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.slate800),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() {
                              _usePasswordMode = false;
                              _errorMessage = null;
                            }),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: !_usePasswordMode
                                    ? AppColors.primary
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                'Quick PIN Pad',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: !_usePasswordMode
                                      ? Colors.white
                                      : AppColors.slate400,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() {
                              _usePasswordMode = true;
                              _errorMessage = null;
                            }),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: _usePasswordMode
                                    ? AppColors.primary
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                'User & Password',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: _usePasswordMode
                                      ? Colors.white
                                      : AppColors.slate400,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // PIN Mode or Password Mode Form
                  if (!_usePasswordMode) _buildPinPad() else _buildPasswordForm(),

                  if (_errorMessage != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.danger.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: AppColors.danger.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.alertCircle,
                              size: 16, color: AppColors.danger),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFFCA5A5),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 28),

                  // Quick Demo Accounts Helper
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.slate900.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.slate800),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'DEMO QUICK LOGIN PINS',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: AppColors.slate400,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          alignment: WrapAlignment.center,
                          children: [
                            _buildQuickPinChip('Cashier PIN', '1111'),
                            _buildQuickPinChip('Manager PIN', '1234'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPinPad() {
    return Column(
      children: [
        // 4 PIN Dots Indicator
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(4, (index) {
            final isFilled = index < _pin.length;
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 8),
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isFilled ? AppColors.primary : Colors.transparent,
                border: Border.all(
                  color: isFilled ? AppColors.primary : AppColors.slate700,
                  width: 2,
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 28),

        // 3x4 Number Keypad Grid
        Column(
          children: [
            for (var row in [
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['C', '0', '⌫']
            ])
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: row.map((key) {
                    final isAction = key == 'C' || key == '⌫';
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 10),
                      width: 68,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _isLoading
                            ? null
                            : () {
                                if (key == 'C') {
                                  setState(() => _pin = '');
                                } else if (key == '⌫') {
                                  _handleBackspace();
                                } else {
                                  _handleKeypadPress(key);
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isAction
                              ? AppColors.slate800
                              : AppColors.slate900,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                            side: const BorderSide(
                                color: AppColors.slate800, width: 1),
                          ),
                          padding: EdgeInsets.zero,
                        ),
                        child: Text(
                          key,
                          style: TextStyle(
                            fontSize: isAction ? 18 : 22,
                            fontWeight: FontWeight.bold,
                            color: isAction
                                ? AppColors.slate300
                                : Colors.white,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildPasswordForm() {
    return Column(
      children: [
        TextField(
          controller: _usernameController,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            fillColor: AppColors.slate900,
            hintText: 'Username (cashier / manager)',
            hintStyle: const TextStyle(color: AppColors.slate500),
            prefixIcon: const Icon(LucideIcons.user,
                color: AppColors.slate400, size: 18),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.slate800),
            ),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _passwordController,
          obscureText: true,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            fillColor: AppColors.slate900,
            hintText: 'Password (1234)',
            hintStyle: const TextStyle(color: AppColors.slate500),
            prefixIcon: const Icon(LucideIcons.lock,
                color: AppColors.slate400, size: 18),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.slate800),
            ),
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _attemptPasswordLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Sign In to Terminal',
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickPinChip(String label, String pin) {
    return InkWell(
      onTap: () {
        setState(() {
          _usePasswordMode = false;
          _pin = pin;
        });
        _attemptPinLogin(pin);
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.slate800,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.slate700),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$label: ',
              style: const TextStyle(fontSize: 11, color: AppColors.slate400),
            ),
            Text(
              pin,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppColors.primaryLight,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
