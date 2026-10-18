enum UserRole {
  cashier('cashier', 'Cashier'),
  manager('manager', 'Store Manager'),
  owner('owner', 'Store Owner');

  final String value;
  final String displayName;

  const UserRole(this.value, this.displayName);

  static UserRole fromString(String val) {
    switch (val.toLowerCase()) {
      case 'cashier':
        return UserRole.cashier;
      case 'manager':
        return UserRole.manager;
      case 'owner':
        return UserRole.owner;
      default:
        return UserRole.cashier;
    }
  }
}

enum PaymentMethod {
  cash('cash', 'Cash'),
  upi('upi', 'UPI / QR'),
  card('card', 'Card'),
  credit('credit', 'Store Credit'),
  giftCard('gift_card', 'Gift Card');

  final String value;
  final String displayName;

  const PaymentMethod(this.value, this.displayName);

  static PaymentMethod fromString(String val) {
    switch (val.toLowerCase()) {
      case 'cash':
        return PaymentMethod.cash;
      case 'upi':
        return PaymentMethod.upi;
      case 'card':
        return PaymentMethod.card;
      case 'credit':
        return PaymentMethod.credit;
      case 'gift_card':
      case 'giftcard':
        return PaymentMethod.giftCard;
      default:
        return PaymentMethod.cash;
    }
  }
}

enum SaleStatus {
  completed,
  held,
  canceled,
  returned;

  String get value => name;
  static SaleStatus fromString(String val) {
    switch (val.toLowerCase()) {
      case 'completed':
        return SaleStatus.completed;
      case 'held':
        return SaleStatus.held;
      case 'canceled':
        return SaleStatus.canceled;
      case 'returned':
        return SaleStatus.returned;
      default:
        return SaleStatus.completed;
    }
  }
}

enum ExpenseCategory {
  rent('Rent'),
  electricity('Electricity & Utilities'),
  salary('Staff Salary'),
  transportation('Transportation & Fuel'),
  inventory('Inventory Purchase'),
  maintenance('Repairs & Maintenance'),
  marketing('Marketing & Ads'),
  other('Other Expense');

  final String displayName;

  const ExpenseCategory(this.displayName);

  static ExpenseCategory fromString(String val) {
    return ExpenseCategory.values.firstWhere(
      (e) => e.name.toLowerCase() == val.toLowerCase(),
      orElse: () => ExpenseCategory.other,
    );
  }
}
