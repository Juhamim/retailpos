class CustomerCreditEntry {
  final String id;
  final String type; // 'charge' (udhaar added) | 'payment' (settlement)
  final double amount;
  final String description;
  final String date;

  CustomerCreditEntry({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.date,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'amount': amount,
        'description': description,
        'date': date,
      };

  factory CustomerCreditEntry.fromJson(Map<String, dynamic> json) =>
      CustomerCreditEntry(
        id: json['id'] ?? '',
        type: json['type'] ?? 'charge',
        amount: (json['amount'] ?? 0).toDouble(),
        description: json['description'] ?? '',
        date: json['date'] ?? DateTime.now().toIso8601String(),
      );
}

class CustomerModel {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String? address;
  final double creditBalance; // current Udhaar / outstanding balance
  final double creditLimit;
  final int loyaltyPoints;
  final double totalSpent;
  final int totalOrders;
  final List<CustomerCreditEntry> ledger;
  final String createdAt;

  CustomerModel({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    this.address,
    this.creditBalance = 0.0,
    this.creditLimit = 10000.0,
    this.loyaltyPoints = 0,
    this.totalSpent = 0.0,
    this.totalOrders = 0,
    this.ledger = const [],
    required this.createdAt,
  });

  bool get hasOutstandingCredit => creditBalance > 0;

  CustomerModel copyWith({
    String? id,
    String? name,
    String? phone,
    String? email,
    String? address,
    double? creditBalance,
    double? creditLimit,
    int? loyaltyPoints,
    double? totalSpent,
    int? totalOrders,
    List<CustomerCreditEntry>? ledger,
    String? createdAt,
  }) {
    return CustomerModel(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      creditBalance: creditBalance ?? this.creditBalance,
      creditLimit: creditLimit ?? this.creditLimit,
      loyaltyPoints: loyaltyPoints ?? this.loyaltyPoints,
      totalSpent: totalSpent ?? this.totalSpent,
      totalOrders: totalOrders ?? this.totalOrders,
      ledger: ledger ?? this.ledger,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'email': email,
        'address': address,
        'creditBalance': creditBalance,
        'creditLimit': creditLimit,
        'loyaltyPoints': loyaltyPoints,
        'totalSpent': totalSpent,
        'totalOrders': totalOrders,
        'ledger': ledger.map((e) => e.toJson()).toList(),
        'createdAt': createdAt,
      };

  factory CustomerModel.fromJson(Map<String, dynamic> json) => CustomerModel(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        phone: json['phone'] ?? '',
        email: json['email'],
        address: json['address'],
        creditBalance: (json['creditBalance'] ?? 0).toDouble(),
        creditLimit: (json['creditLimit'] ?? 10000).toDouble(),
        loyaltyPoints: (json['loyaltyPoints'] ?? 0).toInt(),
        totalSpent: (json['totalSpent'] ?? 0).toDouble(),
        totalOrders: (json['totalOrders'] ?? 0).toInt(),
        ledger: (json['ledger'] as List<dynamic>? ?? [])
            .map((e) => CustomerCreditEntry.fromJson(e))
            .toList(),
        createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
      );
}
