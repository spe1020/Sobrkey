import { format, formatDistance, formatRelative, isToday, isYesterday, differenceInDays } from 'date-fns';

/**
 * Format a date using date-fns
 * @param {Date|number} date - Date object or timestamp
 * @param {string} [formatString='MM/dd/yyyy'] - Format string for date-fns
 * @returns {string} Formatted date string
 */
export function formatDate(date, formatString = 'MM/dd/yyyy') {
  try {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a Unix timestamp to a readable date/time string
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted date/time string
 */
export function formatTimestamp(timestamp) {
  try {
    // Convert seconds to milliseconds
    const date = new Date(timestamp * 1000);
    
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy') + ` at ${format(date, 'h:mm a')}`;
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid timestamp';
  }
}

/**
 * Format a time ago string using date-fns
 * @param {Date|number} date - Date object or timestamp
 * @returns {string} Time ago string (e.g. "5 minutes ago")
 */
export function formatTimeAgo(date) {
  try {
    const dateObj = typeof date === 'number' 
      ? new Date(date * 1000) // Assume seconds if it's a number
      : date;
    
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting time ago:', error);
    return 'some time ago';
  }
}

/**
 * Format a relative time string using date-fns
 * @param {Date|number} date - Date object or timestamp
 * @returns {string} Relative time string (e.g. "yesterday", "last Friday")
 */
export function formatRelativeTime(date) {
  try {
    const dateObj = typeof date === 'number' 
      ? new Date(date * 1000) // Assume seconds if it's a number
      : date;
    
    return formatRelative(dateObj, new Date());
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'some time';
  }
}

/**
 * Get the current date as YYYY-MM-DD
 * @returns {string} Current date as YYYY-MM-DD
 */
export function getCurrentDateString() {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Check if two dates are on the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are on the same day
 */
export function isSameDay(date1, date2) {
  return format(date1, 'yyyy-MM-dd') === format(date2, 'yyyy-MM-dd');
}

/**
 * Calculate the number of days between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of days between dates
 */
export function daysBetween(date1, date2) {
  return Math.abs(differenceInDays(date1, date2));
}

/**
 * Check if a date is consecutive to another date (1 day difference)
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are consecutive
 */
export function isConsecutiveDay(date1, date2) {
  return differenceInDays(date1, date2) === 1 || differenceInDays(date2, date1) === 1;
}
