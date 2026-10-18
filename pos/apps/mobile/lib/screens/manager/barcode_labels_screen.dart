import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/product_model.dart';
import '../../providers/product_provider.dart';

class BarcodeLabelsScreen extends StatefulWidget {
  const BarcodeLabelsScreen({Key? key}) : super(key: key);

  @override
  State<BarcodeLabelsScreen> createState() => _BarcodeLabelsScreenState();
}

class _BarcodeLabelsScreenState extends State<BarcodeLabelsScreen> {
  ProductModel? _selectedProduct;
  int _labelCount = 12;

  Future<void> _printBarcodeSheet(ProductModel product, int count) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(10 * PdfPageFormat.mm),
        build: (pw.Context context) {
          return pw.GridView(
            crossAxisCount: 3,
            childAspectRatio: 1.6,
            crossAxisSpacing: 6 * PdfPageFormat.mm,
            mainAxisSpacing: 6 * PdfPageFormat.mm,
            children: List.generate(count, (index) {
              return pw.Container(
                padding: const pw.EdgeInsets.all(4 * PdfPageFormat.mm),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey400, width: 0.5),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                ),
                child: pw.Column(
                  mainAxisAlignment: pw.MainAxisAlignment.center,
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    pw.Text(
                      'RETAILFLOW STORE',
                      style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold),
                    ),
                    pw.Text(
                      product.name,
                      maxLines: 1,
                      style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
                    ),
                    pw.SizedBox(height: 2),
                    pw.BarcodeWidget(
                      barcode: pw.Barcode.code128(),
                      data: product.barcode.isNotEmpty ? product.barcode : product.sku,
                      width: 100,
                      height: 22,
                      drawText: true,
                      textStyle: const pw.TextStyle(fontSize: 6),
                    ),
                    pw.SizedBox(height: 2),
                    pw.Text(
                      'MRP: ${Formatters.currency(product.sellingPrice)} (Inc. Tax)',
                      style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold),
                    ),
                  ],
                ),
              );
            }),
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (format) async => pdf.save(),
      name: 'Barcode_Labels_${product.sku}.pdf',
    );
  }

  @override
  Widget build(BuildContext context) {
    final productProv = context.watch<ProductProvider>();
    final products = productProv.products;

    if (_selectedProduct == null && products.isNotEmpty) {
      _selectedProduct = products.first;
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Controls Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Barcode Shelf Label Generator',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.slate900),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Generate and print custom barcode price stickers (single or A4 sheet layout)',
                    style: TextStyle(fontSize: 12, color: AppColors.slate500),
                  ),
                  const SizedBox(height: 16),

                  // Select Product Dropdown
                  DropdownButtonFormField<ProductModel>(
                    value: _selectedProduct,
                    decoration: const InputDecoration(labelText: 'Select Product'),
                    items: products.map((p) {
                      return DropdownMenuItem(
                        value: p,
                        child: Text('${p.name} (${p.sku}) - ${Formatters.currency(p.sellingPrice)}'),
                      );
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedProduct = val),
                  ),
                  const SizedBox(height: 14),

                  // Label Count Selector
                  Row(
                    children: [
                      const Text('Sticker Count: ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(width: 12),
                      Wrap(
                        spacing: 8,
                        children: [1, 6, 12, 24, 30].map((cnt) {
                          final isSel = _labelCount == cnt;
                          return ChoiceChip(
                            label: Text('$cnt Stickers'),
                            selected: isSel,
                            onSelected: (_) => setState(() => _labelCount = cnt),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Live Sticker Preview Card
            if (_selectedProduct != null) ...[
              const Text(
                'Live Sticker Preview',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.slate900),
              ),
              const SizedBox(height: 10),

              Center(
                child: Container(
                  width: 280,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.slate300, width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'RETAILFLOW STORE',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.slate500),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _selectedProduct!.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),

                      // Simulated barcode stripes
                      Container(
                        height: 38,
                        color: AppColors.slate100,
                        alignment: Alignment.center,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(LucideIcons.scan, size: 24, color: AppColors.slate800),
                            const SizedBox(width: 8),
                            Text(
                              _selectedProduct!.barcode,
                              style: const TextStyle(
                                fontSize: 13,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'MRP: ${Formatters.currency(_selectedProduct!.sellingPrice)} (Inc. GST)',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: AppColors.primaryDark),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Print Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () => _printBarcodeSheet(_selectedProduct!, _labelCount),
                  icon: const Icon(LucideIcons.printer, size: 18),
                  label: Text('Print $_labelCount Barcode Stickers (PDF / Thermal)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
