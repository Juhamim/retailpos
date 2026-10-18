import 'package:flutter/services.dart';

class AudioHelper {
  static void playBeep() {
    // Perform standard Android haptic & feedback beep
    HapticFeedback.mediumImpact();
    SystemSound.play(SystemSoundType.click);
  }

  static void playSuccess() {
    HapticFeedback.heavyImpact();
    SystemSound.play(SystemSoundType.click);
  }
}
