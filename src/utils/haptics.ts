/**
 * Tactile Feedback / Vibration Utility for Keys by Ru
 * Uses navigator.vibrate API with iOS fallback handling and custom haptic rhythms.
 */

export type HapticType = 'light' | 'key' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

class HapticsManager {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Trigger haptic vibration with given pattern or duration
   */
  public trigger(type: HapticType = 'light'): void {
    if (!this.enabled) return;
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'key':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(40);
          break;
        case 'success':
          navigator.vibrate([15, 40, 20]);
          break;
        case 'warning':
          navigator.vibrate([25, 40, 25]);
          break;
        case 'error':
          navigator.vibrate([40, 60, 40]);
          break;
        default:
          navigator.vibrate(12);
      }
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  }

  /**
   * Custom pulse sequence in milliseconds
   */
  public pulse(pattern: number | number[]): void {
    if (!this.enabled) return;
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore
    }
  }
}

export const haptics = new HapticsManager();
