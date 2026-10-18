import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/audio_helper.dart';

class CameraScannerDialog extends StatefulWidget {
  final Function(String barcode) onScan;

  const CameraScannerDialog({Key? key, required this.onScan}) : super(key: key);

  @override
  State<CameraScannerDialog> createState() => _CameraScannerDialogState();
}

class _CameraScannerDialogState extends State<CameraScannerDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  final TextEditingController _manualInputCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animController.dispose();
    _manualInputCtrl.dispose();
    super.dispose();
  }

  void _submitBarcode(String code) {
    final clean = code.trim();
    if (clean.isNotEmpty) {
      AudioHelper.playBeep();
      widget.onScan(clean);
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.black,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420, maxHeight: 520),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(LucideIcons.camera, size: 20, color: Colors.white),
                      SizedBox(width: 8),
                      Text(
                        'Barcode Scanner',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 18, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Scanner Viewfinder Area
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.slate900,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.slate800),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Viewfinder Box
                      Container(
                        width: 220,
                        height: 140,
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.primary, width: 2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      // Animated Scan Laser Line
                      AnimatedBuilder(
                        animation: _animController,
                        builder: (context, child) {
                          return Positioned(
                            top: 80 + (_animController.value * 120),
                            child: Container(
                              width: 200,
                              height: 2,
                              decoration: BoxDecoration(
                                color: AppColors.danger,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.danger.withOpacity(0.8),
                                    blurRadius: 8,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                      const Positioned(
                        bottom: 16,
                        child: Text(
                          'Align barcode inside frame to scan',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.slate400,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Manual Input fallback
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _manualInputCtrl,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'Enter Barcode or SKU manually...',
                        hintStyle: const TextStyle(color: AppColors.slate500),
                        fillColor: AppColors.slate900,
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: AppColors.slate800),
                        ),
                      ),
                      onSubmitted: _submitBarcode,
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () => _submitBarcode(_manualInputCtrl.text),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Add'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
