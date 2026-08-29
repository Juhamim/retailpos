/**
 * Utility to play a premium synthesized barcode scan/action confirmation beep
 * using the HTML5 Web Audio API (cross-platform, zero dependencies).
 */
export const playBeep = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(950, audioCtx.currentTime); // High pitch retail scan frequency
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Soft volume limit

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.09); // Short 90ms chirp
  } catch (err) {
    console.warn("Audio Context playback blocked or unsupported:", err);
  }
};
