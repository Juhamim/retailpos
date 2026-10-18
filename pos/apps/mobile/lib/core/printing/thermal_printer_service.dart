import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../models/sale_model.dart';
import '../../models/shift_model.dart';
import '../utils/formatters.dart';

class ThermalPrinterService {
  /// Generates a clean 80mm / 58mm POS thermal receipt slip
  static Future<Uint8List> generateThermalReceiptPdf(SaleModel sale) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: const PdfPageFormat(
          72 * PdfPageFormat.mm,
          double.infinity,
          marginAll: 4 * PdfPageFormat.mm,
        ),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              pw.Text(
                'RETAILFLOW POS',
                style: pw.TextStyle(
                  fontSize: 14,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
              pw.SizedBox(height: 2),
              pw.Text(
                'Main Market Road, City Center',
                style: const pw.TextStyle(fontSize: 8),
              ),
              pw.Text(
                'Tel: +91 98765 00000 | GSTIN: 29AABCU9603R1ZM',
                style: const pw.TextStyle(fontSize: 7),
              ),
              pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),

              // Metadata
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Inv: ${sale.invoiceNumber}',
                      style: const pw.TextStyle(fontSize: 7)),
                  pw.Text(Formatters.time(sale.createdAt),
                      style: const pw.TextStyle(fontSize: 7)),
                ],
              ),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Date: ${Formatters.date(sale.createdAt)}',
                      style: const pw.TextStyle(fontSize: 7)),
                  pw.Text('Cashier: ${sale.cashierName}',
                      style: const pw.TextStyle(fontSize: 7)),
                ],
              ),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Customer: ${sale.customerName}',
                      style: const pw.TextStyle(fontSize: 7)),
                  pw.Text('Status: PAID',
                      style: pw.TextStyle(
                          fontSize: 7, fontWeight: pw.FontWeight.bold)),
                ],
              ),
              pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),

              // Items Table Header
              pw.Row(
                children: [
                  pw.Expanded(
                    flex: 5,
                    child: pw.Text('Item',
                        style: pw.TextStyle(
                            fontSize: 7, fontWeight: pw.FontWeight.bold)),
                  ),
                  pw.Expanded(
                    flex: 2,
                    child: pw.Text('Qty',
                        textAlign: pw.TextAlign.center,
                        style: pw.TextStyle(
                            fontSize: 7, fontWeight: pw.FontWeight.bold)),
                  ),
                  pw.Expanded(
                    flex: 2,
                    child: pw.Text('Rate',
                        textAlign: pw.TextAlign.right,
                        style: pw.TextStyle(
                            fontSize: 7, fontWeight: pw.FontWeight.bold)),
                  ),
                  pw.Expanded(
                    flex: 3,
                    child: pw.Text('Total',
                        textAlign: pw.TextAlign.right,
                        style: pw.TextStyle(
                            fontSize: 7, fontWeight: pw.FontWeight.bold)),
                  ),
                ],
              ),
              pw.SizedBox(height: 2),

              // Items List
              ...sale.items.map((item) {
                return pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(vertical: 1.5),
                  child: pw.Row(
                    children: [
                      pw.Expanded(
                        flex: 5,
                        child: pw.Text(item.productName,
                            style: const pw.TextStyle(fontSize: 7)),
                      ),
                      pw.Expanded(
                        flex: 2,
                        child: pw.Text('${item.quantity}',
                            textAlign: pw.TextAlign.center,
                            style: const pw.TextStyle(fontSize: 7)),
                      ),
                      pw.Expanded(
                        flex: 2,
                        child: pw.Text(
                            item.unitPrice.toStringAsFixed(2),
                            textAlign: pw.TextAlign.right,
                            style: const pw.TextStyle(fontSize: 7)),
                      ),
                      pw.Expanded(
                        flex: 3,
                        child: pw.Text(
                            item.total.toStringAsFixed(2),
                            textAlign: pw.TextAlign.right,
                            style: pw.TextStyle(
                                fontSize: 7, fontWeight: pw.FontWeight.bold)),
                      ),
                    ],
                  ),
                );
              }),

              pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),

              // Financial Totals
              _buildThermalRow('Subtotal', sale.subtotal.toStringAsFixed(2)),
              if (sale.discountAmount > 0)
                _buildThermalRow('Discount', '- ${sale.discountAmount.toStringAsFixed(2)}'),
              _buildThermalRow('GST Tax', sale.taxAmount.toStringAsFixed(2)),
              pw.Divider(thickness: 0.5),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('NET TOTAL:',
                      style: pw.TextStyle(
                          fontSize: 9, fontWeight: pw.FontWeight.bold)),
                  pw.Text(Formatters.currency(sale.totalAmount),
                      style: pw.TextStyle(
                          fontSize: 9, fontWeight: pw.FontWeight.bold)),
                ],
              ),
              pw.Divider(thickness: 0.5),

              // Payments breakdown
              ...sale.payments.map((p) => _buildThermalRow(
                    'Tender (${p.method.displayName})',
                    Formatters.currency(p.amount),
                  )),

              pw.SizedBox(height: 6),
              pw.BarcodeWidget(
                barcode: pw.Barcode.code128(),
                data: sale.invoiceNumber,
                width: 140,
                height: 25,
                drawText: false,
              ),
              pw.SizedBox(height: 4),
              pw.Text('*** THANK YOU FOR SHOPPING! ***',
                  style: const pw.TextStyle(fontSize: 7)),
              pw.Text('Software powered by RetailFlow POS',
                  style: const pw.TextStyle(fontSize: 6)),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  /// Generates Shift Close Z-Report slip
  static Future<Uint8List> generateShiftZReportPdf(ShiftModel shift) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: const PdfPageFormat(
          72 * PdfPageFormat.mm,
          double.infinity,
          marginAll: 4 * PdfPageFormat.mm,
        ),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              pw.Text(
                'REGISTER SHIFT Z-REPORT',
                style: pw.TextStyle(
                  fontSize: 11,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
              pw.Text('Terminal #01 - RetailFlow POS',
                  style: const pw.TextStyle(fontSize: 7)),
              pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),

              _buildThermalRow('Cashier', shift.cashierName),
              _buildThermalRow('Start', Formatters.dateTime(shift.startTime)),
              _buildThermalRow(
                  'End',
                  shift.endTime != null
                      ? Formatters.dateTime(shift.endTime)
                      : 'Active'),
              pw.Divider(thickness: 0.5),

              _buildThermalRow('Opening Float', Formatters.currency(shift.openingCash)),
              _buildThermalRow('Cash Sales', Formatters.currency(shift.totalCashSales)),
              _buildThermalRow('UPI / QR Sales', Formatters.currency(shift.totalUpiSales)),
              _buildThermalRow('Card Sales', Formatters.currency(shift.totalCardSales)),
              _buildThermalRow('Store Credit', Formatters.currency(shift.totalCreditSales)),
              _buildThermalRow('Cash In (Drops In)', Formatters.currency(shift.totalCashIn)),
              _buildThermalRow('Cash Out (P/O)', Formatters.currency(shift.totalCashOut)),
              pw.Divider(thickness: 0.5),

              _buildThermalRow(
                  'Expected In Drawer',
                  Formatters.currency(shift.expectedCashInDrawer),
                  isBold: true),
              if (shift.closingCashActual != null) ...[
                _buildThermalRow('Actual Counted',
                    Formatters.currency(shift.closingCashActual),
                    isBold: true),
                _buildThermalRow('Variance (Over/Short)',
                    Formatters.currency(shift.variance ?? 0.0),
                    isBold: true),
              ],
              pw.Divider(thickness: 0.5),
              _buildThermalRow('Gross Sales Total',
                  Formatters.currency(shift.totalGrossSales),
                  isBold: true),
              _buildThermalRow(
                  'Total Transactions', '${shift.totalTransactions} bills'),

              pw.SizedBox(height: 8),
              pw.Text('Audited & Confirmed',
                  style: const pw.TextStyle(fontSize: 7)),
              pw.SizedBox(height: 12),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Cashier Sign: _________',
                      style: const pw.TextStyle(fontSize: 6)),
                  pw.Text('Manager Sign: _________',
                      style: const pw.TextStyle(fontSize: 6)),
                ],
              ),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  static pw.Widget _buildThermalRow(String label, String value,
      {bool isBold = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label,
              style: pw.TextStyle(
                  fontSize: 7,
                  fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal)),
          pw.Text(value,
              style: pw.TextStyle(
                  fontSize: 7,
                  fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal)),
        ],
      ),
    );
  }

  /// Print to connected Android printer or system preview
  static Future<void> printReceipt(SaleModel sale) async {
    final bytes = await generateThermalReceiptPdf(sale);
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => bytes,
      name: 'Receipt_${sale.invoiceNumber}.pdf',
    );
  }

  /// Print Z-Report
  static Future<void> printZReport(ShiftModel shift) async {
    final bytes = await generateShiftZReportPdf(shift);
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => bytes,
      name: 'Shift_ZReport_${shift.id}.pdf',
    );
  }
}
