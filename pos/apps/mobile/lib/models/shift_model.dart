class ShiftMovement {
  final String id;
  final String type; // 'cash_in' | 'cash_out' (drop)
  final double amount;
  final String reason;
  final String timestamp;

  ShiftMovement({
    required this.id,
    required this.type,
    required this.amount,
    required this.reason,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'amount': amount,
        'reason': reason,
        'timestamp': timestamp,
      };

  factory ShiftMovement.fromJson(Map<String, dynamic> json) => ShiftMovement(
        id: json['id'] ?? '',
        type: json['type'] ?? 'cash_in',
        amount: (json['amount'] ?? 0).toDouble(),
        reason: json['reason'] ?? '',
        timestamp: json['timestamp'] ?? DateTime.now().toIso8601String(),
      );
}

class ShiftModel {
  final String id;
  final String cashierId;
  final String cashierName;
  final String startTime;
  final String? endTime;
  final double openingCash;
  final double totalCashSales;
  final double totalUpiSales;
  final double totalCardSales;
  final double totalCreditSales;
  final double totalGrossSales;
  final int totalTransactions;
  final List<ShiftMovement> movements;
  final double? closingCashActual;
  final double? variance;
  final String? notes;
  final bool isOpen;

  ShiftModel({
    required this.id,
    required this.cashierId,
    required this.cashierName,
    required this.startTime,
    this.endTime,
    required this.openingCash,
    this.totalCashSales = 0.0,
    this.totalUpiSales = 0.0,
    this.totalCardSales = 0.0,
    this.totalCreditSales = 0.0,
    this.totalGrossSales = 0.0,
    this.totalTransactions = 0,
    this.movements = const [],
    this.closingCashActual,
    this.variance,
    this.notes,
    this.isOpen = true,
  });

  double get totalCashIn => movements
      .where((m) => m.type == 'cash_in')
      .fold(0.0, (sum, m) => sum + m.amount);

  double get totalCashOut => movements
      .where((m) => m.type == 'cash_out')
      .fold(0.0, (sum, m) => sum + m.amount);

  double get expectedCashInDrawer =>
      openingCash + totalCashSales + totalCashIn - totalCashOut;

  ShiftModel copyWith({
    String? id,
    String? cashierId,
    String? cashierName,
    String? startTime,
    String? endTime,
    double? openingCash,
    double? totalCashSales,
    double? totalUpiSales,
    double? totalCardSales,
    double? totalCreditSales,
    double? totalGrossSales,
    int? totalTransactions,
    List<ShiftMovement>? movements,
    double? closingCashActual,
    double? variance,
    String? notes,
    bool? isOpen,
  }) {
    return ShiftModel(
      id: id ?? this.id,
      cashierId: cashierId ?? this.cashierId,
      cashierName: cashierName ?? this.cashierName,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      openingCash: openingCash ?? this.openingCash,
      totalCashSales: totalCashSales ?? this.totalCashSales,
      totalUpiSales: totalUpiSales ?? this.totalUpiSales,
      totalCardSales: totalCardSales ?? this.totalCardSales,
      totalCreditSales: totalCreditSales ?? this.totalCreditSales,
      totalGrossSales: totalGrossSales ?? this.totalGrossSales,
      totalTransactions: totalTransactions ?? this.totalTransactions,
      movements: movements ?? this.movements,
      closingCashActual: closingCashActual ?? this.closingCashActual,
      variance: variance ?? this.variance,
      notes: notes ?? this.notes,
      isOpen: isOpen ?? this.isOpen,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'cashierId': cashierId,
        'cashierName': cashierName,
        'startTime': startTime,
        'endTime': endTime,
        'openingCash': openingCash,
        'totalCashSales': totalCashSales,
        'totalUpiSales': totalUpiSales,
        'totalCardSales': totalCardSales,
        'totalCreditSales': totalCreditSales,
        'totalGrossSales': totalGrossSales,
        'totalTransactions': totalTransactions,
        'movements': movements.map((m) => m.toJson()).toList(),
        'closingCashActual': closingCashActual,
        'variance': variance,
        'notes': notes,
        'isOpen': isOpen,
      };

  factory ShiftModel.fromJson(Map<String, dynamic> json) => ShiftModel(
        id: json['id'] ?? '',
        cashierId: json['cashierId'] ?? '',
        cashierName: json['cashierName'] ?? '',
        startTime: json['startTime'] ?? DateTime.now().toIso8601String(),
        endTime: json['endTime'],
        openingCash: (json['openingCash'] ?? 0).toDouble(),
        totalCashSales: (json['totalCashSales'] ?? 0).toDouble(),
        totalUpiSales: (json['totalUpiSales'] ?? 0).toDouble(),
        totalCardSales: (json['totalCardSales'] ?? 0).toDouble(),
        totalCreditSales: (json['totalCreditSales'] ?? 0).toDouble(),
        totalGrossSales: (json['totalGrossSales'] ?? 0).toDouble(),
        totalTransactions: (json['totalTransactions'] ?? 0).toInt(),
        movements: (json['movements'] as List<dynamic>? ?? [])
            .map((m) => ShiftMovement.fromJson(m))
            .toList(),
        closingCashActual: json['closingCashActual'] != null
            ? (json['closingCashActual']).toDouble()
            : null,
        variance: json['variance'] != null
            ? (json['variance']).toDouble()
            : null,
        notes: json['notes'],
        isOpen: json['isOpen'] ?? true,
      );
}
