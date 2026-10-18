import '../core/constants/app_enums.dart';

class UserModel {
  final String id;
  final String username;
  final String email;
  final String pin;
  final String firstName;
  final String lastName;
  final UserRole role;
  final bool isActive;
  final String createdAt;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.pin,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.isActive = true,
    required this.createdAt,
  });

  String get fullName => '$firstName $lastName'.trim();
  String get initials {
    final first = firstName.isNotEmpty ? firstName[0] : '';
    final last = lastName.isNotEmpty ? lastName[0] : '';
    return '$first$last'.toUpperCase();
  }

  bool get isManager => role == UserRole.manager || role == UserRole.owner;
  bool get isCashier => role == UserRole.cashier;

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'email': email,
        'pin': pin,
        'firstName': firstName,
        'lastName': lastName,
        'role': role.value,
        'isActive': isActive,
        'createdAt': createdAt,
      };

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] ?? '',
        username: json['username'] ?? '',
        email: json['email'] ?? '',
        pin: json['pin'] ?? '',
        firstName: json['firstName'] ?? '',
        lastName: json['lastName'] ?? '',
        role: UserRole.fromString(json['role'] ?? 'cashier'),
        isActive: json['isActive'] ?? true,
        createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
      );
}
