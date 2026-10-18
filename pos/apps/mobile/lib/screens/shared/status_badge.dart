import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

enum BadgeType { success, warning, danger, info, neutral }

class StatusBadge extends StatelessWidget {
  final String label;
  final BadgeType type;
  final IconData? icon;

  const StatusBadge({
    Key? key,
    required this.label,
    this.type = BadgeType.neutral,
    this.icon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color text;
    Color border;

    switch (type) {
      case BadgeType.success:
        bg = AppColors.successMuted;
        text = const Color(0xFF047857);
        border = AppColors.successBorder;
        break;
      case BadgeType.warning:
        bg = AppColors.warningMuted;
        text = const Color(0xFFB45309);
        border = AppColors.warningBorder;
        break;
      case BadgeType.danger:
        bg = AppColors.dangerMuted;
        text = const Color(0xFFB91C1C);
        border = AppColors.dangerBorder;
        break;
      case BadgeType.info:
        bg = AppColors.infoMuted;
        text = const Color(0xFF1D4ED8);
        border = const Color(0xFFBFDBFE);
        break;
      case BadgeType.neutral:
        bg = AppColors.slate100;
        text = AppColors.slate700;
        border = AppColors.slate200;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border, width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 10, color: text),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              color: text,
              letterSpacing: 0.1,
            ),
          ),
        ],
      ),
    );
  }
}
