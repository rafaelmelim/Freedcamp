/**
 * Utility functions for time formatting and conversion
 */

/**
 * Converts integer hours to hh:mm:ss format
 * @param hours - Integer number of hours
 * @returns Formatted string in hh:mm:ss format
 */
export function formatHoursToHHMMSS(hours: number | null): string {
  if (!hours || hours === 0) return '00:00:00';
  
  const h = Math.floor(Math.abs(hours));
  return `${h.toString().padStart(2, '0')}:00:00`;
}

/**
 * Parses hh:mm:ss format to integer hours (rounded to nearest hour)
 * @param timeString - Time string in hh:mm:ss format
 * @returns Integer number of hours
 */
export function parseHHMMSSToHours(timeString: string): number {
  if (!timeString || timeString === '00:00:00') return 0;
  
  const parts = timeString.split(':');
  if (parts.length !== 3) return 0;
  
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseInt(parts[2]) || 0;
  
  // Convert to total hours and round to nearest integer
  const totalHours = hours + (minutes / 60) + (seconds / 3600);
  return Math.round(totalHours);
}