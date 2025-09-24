/**
 * Generates unique IDs for database entities
 * Using a combination of timestamp and random string for uniqueness
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Generates a shorter ID for use in shareable links
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Generates a formatted event ID with prefix
 */
export function generateEventId(): string {
  return `event_${generateId()}`;
}

/**
 * Generates a formatted member ID with prefix
 */
export function generateMemberId(): string {
  return `member_${generateId()}`;
}

/**
 * Generates a formatted assignment ID with prefix
 */
export function generateAssignmentId(): string {
  return `assign_${generateId()}`;
}

/**
 * Generates a formatted traffic control ID with prefix
 */
export function generateTrafficId(): string {
  return `traffic_${generateId()}`;
}

/**
 * Generates a formatted supervisor ID with prefix
 */
export function generateSupervisorId(): string {
  return `super_${generateId()}`;
}