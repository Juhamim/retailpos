import 'package:intl/intl.dart';

class Formatters {
  static final NumberFormat _currencyFormat = NumberFormat.currency(
    symbol: '₹',
    decimalDigits: 2,
  );

  static final DateFormat _dateTimeFormat = DateFormat('dd MMM yyyy, hh:mm a');
  static final DateFormat _dateFormat = DateFormat('dd MMM yyyy');
  static final DateFormat _timeFormat = DateFormat('hh:mm a');

  static String currency(num? amount) {
    if (amount == null) return '₹0.00';
    return _currencyFormat.format(amount);
  }

  static String dateTime(dynamic date) {
    if (date == null) return '-';
    if (date is String) {
      final parsed = DateTime.tryParse(date);
      if (parsed == null) return date;
      return _dateTimeFormat.format(parsed);
    }
    if (date is DateTime) {
      return _dateTimeFormat.format(date);
    }
    return date.toString();
  }

  static String date(dynamic date) {
    if (date == null) return '-';
    if (date is String) {
      final parsed = DateTime.tryParse(date);
      if (parsed == null) return date;
      return _dateFormat.format(parsed);
    }
    if (date is DateTime) {
      return _dateFormat.format(date);
    }
    return date.toString();
  }

  static String time(dynamic date) {
    if (date == null) return '-';
    if (date is String) {
      final parsed = DateTime.tryParse(date);
      if (parsed == null) return date;
      return _timeFormat.format(parsed);
    }
    if (date is DateTime) {
      return _timeFormat.format(date);
    }
    return date.toString();
  }
}
