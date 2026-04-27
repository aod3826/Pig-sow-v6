export type VibrationPattern = 'SUCCESS' | 'WARNING' | 'URGENT';

export const triggerVibration = (pattern: VibrationPattern) => {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  switch (pattern) {
    case 'SUCCESS':
      navigator.vibrate(200);
      break;
    case 'WARNING':
      navigator.vibrate([200, 100, 200]);
      break;
    case 'URGENT':
      navigator.vibrate([500, 200, 500, 200, 500]);
      break;
  }
};
