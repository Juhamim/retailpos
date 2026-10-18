import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_enums.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/audio_helper.dart';
import '../../models/sale_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/product_provider.dart';
import '../../providers/pos_provider.dart';
import '../../providers/shift_provider.dart';
import '../../providers/customer_provider.dart';
import '../../providers/sales_provider.dart';
import 'widgets/product_grid_widget.dart';
import 'widgets/cart_panel_widget.dart';
import 'widgets/payment_dialog.dart';
import 'widgets/receipt_dialog.dart';
import 'widgets/hold_sales_dialog.dart';
import 'widgets/customer_select_dialog.dart';
import 'widgets/camera_scanner_dialog.dart';

class PosScreen extends StatefulWidget {
  const PosScreen({Key? key}) : super(key: key);

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  final TextEditingController _searchCtrl = TextEditingController();

  void _handleBarcodeSubmit(String query) {
    if (query.trim().isEmpty) return;
    final productProv = context.read<ProductProvider>();
    final posProv = context.read<PosProvider>();

    final matched = productProv.findByBarcode(query);
    if (matched != null) {
      if (matched.stockQuantity <= 0) {
        _showToast('Warning: "${matched.name}" is out of stock!');
      }
      posProv.addToCart(matched);
      AudioHelper.playBeep();
      _showToast('Added: ${matched.name}');
      _searchCtrl.clear();
      productProv.setSearchQuery('');
    } else {
      // Filter list
      productProv.setSearchQuery(query);
    }
  }

  void _showToast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _triggerCheckout(List<PaymentRecord> payments) async {
    final pos = context.read<PosProvider>();
    final shiftProv = context.read<ShiftProvider>();
    final productProv = context.read<ProductProvider>();
    final salesProv = context.read<SalesProvider>();
    final custProv = context.read<CustomerProvider>();
    final auth = context.read<AuthProvider>();

    if (pos.cart.isEmpty) return;

    if (!shiftProv.hasActiveShift) {
      _showToast('Please open Register Shift first in Shifts tab.');
      return;
    }

    final invoiceNumber =
        'INV-${DateTime.now().year}${DateTime.now().month.toString().padLeft(2, '0')}${DateTime.now().day.toString().padLeft(2, '0')}-${(1000 + (DateTime.now().millisecondsSinceEpoch % 9000))}';

    final saleItems = pos.cart
        .map((item) => SaleItemRecord(
              productId: item.product.id,
              productName: item.product.name,
              sku: item.product.sku,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              discountPercent: item.discountPercent,
              taxRate: item.product.taxRate,
              taxAmount: item.taxAmount,
              total: item.totalWithTax,
            ))
        .toList();

    final sale = SaleModel(
      id: 'sale-${DateTime.now().millisecondsSinceEpoch}',
      invoiceNumber: invoiceNumber,
      customerId: pos.selectedCustomer?.id,
      customerName: pos.selectedCustomer?.name ?? 'Walk-in Customer',
      items: saleItems,
      subtotal: pos.subtotal,
      taxAmount: pos.taxAmount,
      discountAmount: pos.orderDiscount,
      totalAmount: pos.total,
      paymentMethod: payments.first.method,
      payments: payments,
      cashierName: auth.currentUser?.fullName ?? 'Cashier',
      createdAt: DateTime.now().toIso8601String(),
    );

    // 1. Deduct Stock
    await productProv.deductStock(
      pos.cart.map((i) => (productId: i.product.id, quantity: i.quantity)).toList(),
    );

    // 2. Record in Sales Store
    await salesProv.recordSale(sale);

    // 3. Record in Shift
    await shiftProv.recordSaleInShift(pos.total, payments);

    // 4. Update Customer CRM / Store Credit if applied
    if (pos.selectedCustomer != null) {
      await custProv.recordCustomerSale(pos.selectedCustomer!.id, pos.total);

      final creditPmt =
          payments.where((p) => p.method == PaymentMethod.credit).firstOrNull;
      if (creditPmt != null) {
        await custProv.recordCreditTransaction(
          customerId: pos.selectedCustomer!.id,
          type: 'charge',
          amount: creditPmt.amount,
          description: 'POS Checkout (Inv: $invoiceNumber)',
        );
      }
    }

    AudioHelper.playSuccess();
    pos.clearCart();

    // Show Receipt Dialog
    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => ReceiptDialog(
          sale: sale,
          onNewSale: () {},
        ),
      );
    }
  }

  void _openHoldDialog() {
    final pos = context.read<PosProvider>();
    if (pos.cart.isEmpty) return;

    final noteCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hold Current Sale', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: TextField(
          controller: noteCtrl,
          decoration: const InputDecoration(
            hintText: 'Order note or customer reference...',
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              pos.holdSale(noteCtrl.text);
              Navigator.pop(ctx);
              _showToast('Order parked in held sales queue');
            },
            child: const Text('Hold Order'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pos = context.watch<PosProvider>();
    final productProv = context.watch<ProductProvider>();
    final isTablet = MediaQuery.of(context).size.width >= 700;

    return Column(
      children: [
        // Top Command Bar (Search / Barcode / Camera / Customer / Held)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(
              bottom: BorderSide(color: AppColors.border, width: 1),
            ),
          ),
          child: Row(
            children: [
              // Search / Barcode Input
              Expanded(
                child: Container(
                  height: 42,
                  decoration: BoxDecoration(
                    color: AppColors.slate50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      const SizedBox(width: 10),
                      const Icon(LucideIcons.scan, size: 18, color: AppColors.slate400),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _searchCtrl,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          decoration: const InputDecoration(
                            hintText: 'Scan Barcode or Search SKU (F2)...',
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            contentPadding: EdgeInsets.zero,
                            isDense: true,
                          ),
                          onChanged: (val) => productProv.setSearchQuery(val),
                          onSubmitted: _handleBarcodeSubmit,
                        ),
                      ),
                      if (_searchCtrl.text.isNotEmpty)
                        IconButton(
                          icon: const Icon(LucideIcons.x, size: 14, color: AppColors.slate400),
                          onPressed: () {
                            _searchCtrl.clear();
                            productProv.setSearchQuery('');
                          },
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Camera Scanner Button
              IconButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (_) => CameraScannerDialog(
                      onScan: _handleBarcodeSubmit,
                    ),
                  );
                },
                icon: const Icon(LucideIcons.camera, size: 20, color: AppColors.slate700),
                tooltip: 'Scan with Camera',
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.slate100,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Customer Selector Button
              InkWell(
                onTap: () {
                  showDialog(
                    context: context,
                    builder: (_) => const CustomerSelectDialog(),
                  );
                },
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  height: 42,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: AppColors.slate100,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.userPlus, size: 16, color: AppColors.primary),
                      const SizedBox(width: 6),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 100),
                        child: Text(
                          pos.selectedCustomer?.name ?? 'Customer',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.slate800,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Held Sales Button
              if (pos.heldSales.isNotEmpty) ...[
                const SizedBox(width: 8),
                InkWell(
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (_) => const HoldSalesDialog(),
                    );
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    height: 42,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: AppColors.warningMuted,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.warningBorder),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.clock, size: 14, color: AppColors.warning),
                        const SizedBox(width: 4),
                        Text(
                          'Held (${pos.heldSales.length})',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF92400E),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),

        // Body: Dual 2-pane on tablet or single catalog with bottom floating bar on mobile
        Expanded(
          child: Row(
            children: [
              // Product Catalog (Left side)
              const Expanded(
                flex: 6,
                child: ProductGridWidget(),
              ),

              // Cart Panel (Right side on tablet)
              if (isTablet)
                Expanded(
                  flex: 4,
                  child: CartPanelWidget(
                    onTriggerPayment: () {
                      showDialog(
                        context: context,
                        builder: (_) => PaymentDialog(
                          totalAmount: pos.total,
                          customerName: pos.selectedCustomer?.name,
                          customerCreditBalance: pos.selectedCustomer?.creditBalance ?? 0.0,
                          onComplete: (payments) {
                            Navigator.pop(context);
                            _triggerCheckout(payments);
                          },
                        ),
                      );
                    },
                    onInstantCheckout: (method) {
                      _triggerCheckout([PaymentRecord(method: method, amount: pos.total)]);
                    },
                    onTriggerHold: _openHoldDialog,
                    onSelectCustomer: () {
                      showDialog(
                        context: context,
                        builder: (_) => const CustomerSelectDialog(),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),

        // Mobile Bottom Floating Cart Bar (if phone layout)
        if (!isTablet && pos.cart.isNotEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.border, width: 1)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 8,
                  offset: Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                // Cart summary
                InkWell(
                  onTap: () {
                    _showMobileCartBottomSheet(context);
                  },
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${pos.cartCount}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Cart Total', style: TextStyle(fontSize: 10, color: AppColors.slate500)),
                          Text(
                            Formatters.currency(pos.total),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Spacer(),

                // Fast Cash Button
                ElevatedButton(
                  onPressed: () => _triggerCheckout([PaymentRecord(method: PaymentMethod.cash, amount: pos.total)]),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('💵 Cash', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 8),

                // View Cart & Pay
                ElevatedButton(
                  onPressed: () => _showMobileCartBottomSheet(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Pay ➔', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
      ],
    );
  }

  void _showMobileCartBottomSheet(BuildContext context) {
    final pos = context.read<PosProvider>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) {
        return SizedBox(
          height: MediaQuery.of(context).size.height * 0.85,
          child: CartPanelWidget(
            onTriggerPayment: () {
              Navigator.pop(context);
              showDialog(
                context: context,
                builder: (_) => PaymentDialog(
                  totalAmount: pos.total,
                  customerName: pos.selectedCustomer?.name,
                  customerCreditBalance: pos.selectedCustomer?.creditBalance ?? 0.0,
                  onComplete: (payments) {
                    Navigator.pop(context);
                    _triggerCheckout(payments);
                  },
                ),
              );
            },
            onInstantCheckout: (method) {
              Navigator.pop(context);
              _triggerCheckout([PaymentRecord(method: method, amount: pos.total)]);
            },
            onTriggerHold: () {
              Navigator.pop(context);
              _openHoldDialog();
            },
            onSelectCustomer: () {
              showDialog(
                context: context,
                builder: (_) => const CustomerSelectDialog(),
              );
            },
          ),
        );
      },
    );
  }
}
