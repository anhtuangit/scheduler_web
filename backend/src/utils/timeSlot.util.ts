/**
 * Determine time slot based on hour
 */
export const getTimeSlot = (hour: number): 'morning' | 'noon' | 'afternoon' | 'evening' => {
  if (hour >= 5 && hour < 11) {
    return 'morning';
  } else if (hour >= 11 && hour < 14) {
    return 'noon';
  } else if (hour >= 14 && hour < 18) {
    return 'afternoon';
  } else {
    return 'evening';
  }
};

/**
 * Get time slot from date
 */
export const getTimeSlotFromDate = (date: Date): 'morning' | 'noon' | 'afternoon' | 'evening' => {
  const hour = date.getHours();
  return getTimeSlot(hour);
};

