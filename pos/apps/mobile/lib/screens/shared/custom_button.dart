import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class CustomButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool isPrimary;
  final bool isDanger;
  final bool isOutline;
  final bool isFullWidth;
  final bool isLoading;
  final double height;

  const CustomButton({
    Key? key,
    required this.label,
    this.icon,
    required this.onPressed,
    this.isPrimary = true,
    this.isDanger = false,
    this.isOutline = false,
    this.isFullWidth = false,
    this.isLoading = false,
    this.height = 48,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bg = AppColors.primary;
    Color fg = Colors.white;
    BorderSide border = BorderSide.none;

    if (isDanger) {
      bg = AppColors.danger;
      fg = Colors.white;
    } else if (isOutline) {
      bg = Colors.white;
      fg = AppColors.slate700;
      border = const BorderSide(color: AppColors.border, width: 1);
    } else if (!isPrimary) {
      bg = AppColors.slate100;
      fg = AppColors.slate800;
    }

    Widget content = Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      children: [
        if (isLoading)
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(fg),
            ),
          )
        else ...[
          if (icon != null) ...[
            Icon(icon, size: 18, color: fg),
            const SizedBox(width: 8),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: fg,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ],
    );

    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      height: height,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: border,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        child: content,
      ),
    );
  }
}
