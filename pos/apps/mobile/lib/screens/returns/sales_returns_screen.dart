import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_enums.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/audio_helper.dart';
import '../../models/sale_model.dart';
import '../../models/inventory_movement_model.dart';
import '../../providers/sales_provider.dart';
import '../../providers/product_provider.dart';
import '../../providers/customer_provider.dart';
import '../../providers/auth_provider.dart';
import '../shared/status_badge.dart';

class SalesReturnsScreen extends StatefulWidget {
  const SalesReturnsScreen({Key? key}) : super(key: key);

  @override
  State<SalesReturnsScreen> createState() => _SalesReturnsScreenState();
}

class _SalesReturnsScreenState extends State<SalesReturnsScreen> {
  final TextEditingController _invoiceSearchCtrl = TextEditingController();
  SaleModel? _selectedSale;
  final Map<String, int> _returnQuantities = {};
  PaymentMethod _refundMethod = PaymentMethod.cash;

  void _searchInvoice() {
    final query = _invoiceSearchCtrl.text.trim();
    if (query.isEmpty) return;

    final salesProv = context.read<SalesProvider>();
    final matched = salesProv.findByInvoice(query);

    setState(() {
      _selectedSale = matched;
      _returnQuantities.clear();
      if (matched != null) {
        for (var item in matched.items) {
          _returnQuantities[item.productId] = 0;
        }
      }
    });

    if (matched == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No invoice found for "$query"')),
      );
    }
  }

  double get _totalRefundAmount {
    if (_selectedSale == null) return 0.0;
    double sum = 0.0;
    for (var item in _selectedSale!.items) {
      final qty = _returnQuantities[item.productId] ?? 0;
      if (qty > 0) {
        sum += (item.unitPrice * qty);
      }
    }
    return sum;
  }

  void _processReturn() async {
    if (_selectedSale == null || _totalRefundAmount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select at least 1 item to return!')),
      );
      return;
    }

    final productProv = context.read<ProductProvider>();
    final salesProv = context.read<SalesProvider>();
    final custProv = context.read<CustomerProvider>();
    final auth = context.read<AuthProvider>();

    final returnedItems = <({String productId, int quantity})>[];

    // 1. Restock items into inventory
    for (var item in _selectedSale!.items) {
      final qty = _returnQuantities[item.productId] ?? 0;
      if (qty > 0) {
        returnedItems.add((productId: item.productId, quantity: qty));
        await productProv.recordStockMovement(
          productId: item.productId,
          type: InventoryMovementType.saleReturn,
          quantityChanged: qty,
          reason: 'Customer Return (Inv: ${_selectedSale!.invoiceNumber})',
          performedBy: auth.currentUser?.fullName ?? 'Staff',
        );
      }
    }

    // 2. Process refund in sales store
    await salesProv.processReturn(
      invoiceNumber: _selectedSale!.invoiceNumber,
      returnedItems: returnedItems,
      refundAmount: _totalRefundAmount,
      refundMethod: _refundMethod,
    );

    // 3. Settle or credit to customer if credit chosen
    if (_refundMethod == PaymentMethod.credit && _selectedSale!.customerId != null) {
      await custProv.recordCreditTransaction(
        customerId: _selectedSale!.customerId!,
        type: 'payment',
        amount: _totalRefundAmount,
        description: 'Sales Return Refund (Inv: ${_selectedSale!.invoiceNumber})',
      );
    }

    AudioHelper.playSuccess();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Return Processed Successfully! Refund: ${Formatters.currency(_totalRefundAmount)}',
          ),
          backgroundColor: AppColors.success,
        ),
      );
      setState(() {
        _selectedSale = null;
        _invoiceSearchCtrl.clear();
        _returnQuantities.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Box
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
                    'Lookup Invoice for Sales Return',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.slate900),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _invoiceSearchCtrl,
                          decoration: const InputDecoration(
                            hintText: 'Enter Invoice Number (e.g. INV-20260901-1001)...',
                            prefixIcon: Icon(LucideIcons.search, size: 16),
                          ),
                          onSubmitted: (_) => _searchInvoice(),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _searchInvoice,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Find Invoice'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Invoice Details & Return Form
            if (_selectedSale != null) ...[
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _selectedSale!.invoiceNumber,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'monospace',
                              ),
                            ),
                            Text(
                              '${Formatters.dateTime(_selectedSale!.createdAt)} • ${_selectedSale!.customerName}',
                              style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                            ),
                          ],
                        ),
                        StatusBadge(
                          label: _selectedSale!.status.name.toUpperCase(),
                          type: _selectedSale!.status == SaleStatus.completed
                              ? BadgeType.success
                              : BadgeType.warning,
                        ),
                      ],
                    ),
                    const Divider(height: 24, color: AppColors.border),

                    const Text(
                      'Select Items to Return:',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),

                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _selectedSale!.items.length,
                      separatorBuilder: (_, __) => const Divider(height: 12, color: AppColors.border),
                      itemBuilder: (context, index) {
                        final item = _selectedSale!.items[index];
                        final returnQty = _returnQuantities[item.productId] ?? 0;

                        return Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.productName,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    'Original Qty: ${item.quantity} • Rate: ${Formatters.currency(item.unitPrice)}',
                                    style: const TextStyle(fontSize: 11, color: AppColors.slate500),
                                  ),
                                ],
                              ),
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(LucideIcons.minusCircle, size: 18),
                                  onPressed: returnQty > 0
                                      ? () {
                                          setState(() {
                                            _returnQuantities[item.productId] = returnQty - 1;
                                          });
                                        }
                                      : null,
                                ),
                                Text(
                                  '$returnQty',
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                                ),
                                IconButton(
                                  icon: const Icon(LucideIcons.plusCircle, size: 18),
                                  onPressed: returnQty < item.quantity
                                      ? () {
                                          setState(() {
                                            _returnQuantities[item.productId] = returnQty + 1;
                                          });
                                        }
                                      : null,
                                ),
                              ],
                            ),
                          ],
                        );
                      },
                    ),

                    const Divider(height: 24, color: AppColors.border),

                    // Refund Summary & Tender method
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Refund Payable:',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                        Text(
                          Formatters.currency(_totalRefundAmount),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.danger,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        const Text('Refund Via: ',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('Cash'),
                          selected: _refundMethod == PaymentMethod.cash,
                          onSelected: (_) => setState(() => _refundMethod = PaymentMethod.cash),
                        ),
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('Store Credit (Khata)'),
                          selected: _refundMethod == PaymentMethod.credit,
                          onSelected: (_) => setState(() => _refundMethod = PaymentMethod.credit),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: _totalRefundAmount > 0 ? _processReturn : null,
                        icon: const Icon(LucideIcons.checkCircle2, size: 18),
                        label: const Text('Confirm Return & Restock Items'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.danger,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
