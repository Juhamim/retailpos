import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_enums.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/audio_helper.dart';
import '../../../providers/pos_provider.dart';

class CartPanelWidget extends StatelessWidget {
  final VoidCallback onTriggerPayment;
  final Function(PaymentMethod) onInstantCheckout;
  final VoidCallback onTriggerHold;
  final VoidCallback onSelectCustomer;

  const CartPanelWidget({
    Key? key,
    required this.onTriggerPayment,
    required this.onInstantCheckout,
    required this.onTriggerHold,
    required this.onSelectCustomer,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final pos = context.watch<PosProvider>();
    final cart = pos.cart;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          left: BorderSide(color: AppColors.border, width: 1),
        ),
      ),
      child: Column(
        children: [
          // Customer & Quick Cart Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: const BoxDecoration(
              color: AppColors.slate50,
              border: Border(
                bottom: BorderSide(color: AppColors.border, width: 1),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                InkWell(
                  onTap: onSelectCustomer,
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.user, size: 14, color: AppColors.primary),
                        const SizedBox(width: 6),
                        Text(
                          pos.selectedCustomer?.name ?? 'Walk-in Customer',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.slate800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (cart.isNotEmpty)
                  IconButton(
                    icon: const Icon(LucideIcons.trash2, size: 16, color: AppColors.danger),
                    tooltip: 'Clear Cart',
                    onPressed: () {
                      pos.clearCart();
                      AudioHelper.playBeep();
                    },
                  ),
              ],
            ),
          ),

          // Cart Items List
          Expanded(
            child: cart.isEmpty
                ? _buildEmptyCart()
                : ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: cart.length,
                    separatorBuilder: (_, __) => const Divider(height: 16, color: AppColors.border),
                    itemBuilder: (context, index) {
                      final item = cart[index];
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Item Name & Rate
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.product.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.slate900,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${Formatters.currency(item.unitPrice)} × ${item.quantity}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.slate500,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Quantity Steppers
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _buildStepBtn(
                                icon: LucideIcons.minus,
                                onTap: () => pos.updateQuantity(item.product.id, -1),
                              ),
                              Container(
                                width: 32,
                                alignment: Alignment.center,
                                child: Text(
                                  '${item.quantity}',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              _buildStepBtn(
                                icon: LucideIcons.plus,
                                onTap: () => pos.updateQuantity(item.product.id, 1),
                              ),
                            ],
                          ),

                          const SizedBox(width: 12),

                          // Line Total
                          Text(
                            Formatters.currency(item.totalWithTax),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: AppColors.slate900,
                            ),
                          ),
                        ],
                      );
                    },
                  ),
          ),

          // Cart Totals & Checkout Actions
          if (cart.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(color: AppColors.border, width: 1),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 8,
                    offset: Offset(0, -2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Subtotal & Tax details
                  _buildTotalRow('Subtotal', Formatters.currency(pos.subtotal)),
                  if (pos.orderDiscount > 0)
                    _buildTotalRow(
                      'Discount',
                      '- ${Formatters.currency(pos.orderDiscount)}',
                      valueColor: AppColors.danger,
                    ),
                  _buildTotalRow('GST Tax', Formatters.currency(pos.taxAmount)),
                  const Divider(height: 16, color: AppColors.border),

                  // Grand Total
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Payable:',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: AppColors.slate900,
                        ),
                      ),
                      Text(
                        Formatters.currency(pos.total),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primaryDark,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Quick Tender Action Buttons
                  Row(
                    children: [
                      // Hold Sale
                      IconButton(
                        onPressed: onTriggerHold,
                        icon: const Icon(LucideIcons.pauseCircle, color: AppColors.warning),
                        tooltip: 'Hold Cart (Park Order)',
                      ),
                      const SizedBox(width: 4),

                      // 1-Tap Cash
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => onInstantCheckout(PaymentMethod.cash),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF059669), // Green
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            '💵 Cash',
                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // 1-Tap UPI QR
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => onInstantCheckout(PaymentMethod.upi),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB), // Blue
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            '📱 UPI QR',
                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Split / Card Tender Modal
                      Expanded(
                        child: ElevatedButton(
                          onPressed: onTriggerPayment,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            '💳 Split/Card',
                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStepBtn({required IconData icon, required VoidCallback onTap}) {
    return InkWell(
      onTap: () {
        onTap();
        AudioHelper.playBeep();
      },
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: AppColors.slate100,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: AppColors.slate200),
        ),
        child: Icon(icon, size: 12, color: AppColors.slate700),
      ),
    );
  }

  Widget _buildTotalRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.slate500)),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: valueColor ?? AppColors.slate800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyCart() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.shoppingBag, size: 40, color: AppColors.slate300),
          SizedBox(height: 12),
          Text(
            'Your Cart is Empty',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.slate600),
          ),
          SizedBox(height: 4),
          Text(
            'Scan barcode or tap products to add',
            style: TextStyle(fontSize: 12, color: AppColors.slate400),
          ),
        ],
      ),
    );
  }
}
