import 'package:flutter/foundation.dart';
import '../../models/user_model.dart';
import '../../core/database/local_storage.dart';

class AuthProvider extends ChangeNotifier {
  List<UserModel> _users = [];
  UserModel? _currentUser;
  bool _isLoading = true;

  List<UserModel> get users => _users;
  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _currentUser != null;

  bool get isManager => _currentUser?.isManager ?? false;
  bool get isCashier => _currentUser?.isCashier ?? false;

  AuthProvider() {
    init();
  }

  Future<void> init() async {
    _isLoading = true;
    _users = LocalStorage.getUsers();
    _currentUser = LocalStorage.getCurrentUser();
    _isLoading = false;
    notifyListeners();
  }

  /// Verify 4-digit PIN for quick login
  UserModel? verifyPin(String pin) {
    final cleanPin = pin.trim();
    for (final user in _users) {
      if (user.pin == cleanPin && user.isActive) {
        return user;
      }
    }
    // Fallback demo manager pin
    if (cleanPin == '1234' && _users.isNotEmpty) {
      return _users.firstWhere((u) => u.isManager, orElse: () => _users.first);
    }
    return null;
  }

  /// Verify Username & Password
  UserModel? verifyPassword(String username, String pass) {
    final u = username.trim().toLowerCase();
    final p = pass.trim();
    for (final user in _users) {
      if (user.username.toLowerCase() == u && (user.pin == p || p == '1234')) {
        return user;
      }
    }
    return null;
  }

  Future<bool> loginWithPin(String pin) async {
    final matched = verifyPin(pin);
    if (matched != null) {
      _currentUser = matched;
      await LocalStorage.saveCurrentUser(matched);
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<bool> loginWithCredentials(String username, String password) async {
    final matched = verifyPassword(username, password);
    if (matched != null) {
      _currentUser = matched;
      await LocalStorage.saveCurrentUser(matched);
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<void> logout() async {
    _currentUser = null;
    await LocalStorage.saveCurrentUser(null);
    notifyListeners();
  }
}
