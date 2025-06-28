/**
 * Utility functions for time formatting and conversion
 */

/**
 * Converts seconds to hh:mm:ss format
 * @param seconds - Total number of seconds
 * @returns Formatted string in hh:mm:ss format
 */
export function formatSecondsToHHMMSS(seconds: number | null): string {
  if (!seconds || seconds === 0) return '00:00:00';
  
  const totalSeconds = Math.abs(seconds);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Parses hh:mm:ss format to total seconds
 * @param timeString - Time string in hh:mm:ss format
 * @returns Total number of seconds
 */
export function parseHHMMSSToSeconds(timeString: string): number {
  if (!timeString || timeString === '00:00:00') return 0;
  
  const parts = timeString.split(':');
  if (parts.length !== 3) return 0;
  
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseInt(parts[2]) || 0;
  
  // Convert to total seconds without rounding
  return (hours * 3600) + (minutes * 60) + seconds;
}