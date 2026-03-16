/**
 * Category configuration for the accordion-based Topics page.
 * Single source of truth for folder display order, icons, and name helpers.
 */

/**
 * Ordered list of all categories for accordion display.
 * Categories not in this list appear last, sorted alphabetically.
 */
export const CATEGORY_DISPLAY_ORDER: string[] = [
  // Tech topics (top)
  'Programming Languages',
  'Frontend',
  'Backend',
  'Architecture',
  'Computer Science',
  'Cloud',
  'DevOps',
  'Databases',
  // Government exams
  'Government Exams',
  // Competitive exams
  'JEE - Class 11',
  'JEE - Class 12',
  'NEET - Class 11',
  'NEET - Class 12',
  // School (bottom)
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

/**
 * MaterialCommunityIcons name for each category's accordion header.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  'Programming Languages': 'code-tags',
  Frontend: 'monitor',
  Backend: 'server',
  Architecture: 'sitemap-outline',
  'Computer Science': 'file-tree',
  Cloud: 'cloud-outline',
  DevOps: 'docker',
  Databases: 'database',
  'Government Exams': 'book-education-outline',
  'JEE - Class 11': 'target',
  'JEE - Class 12': 'target',
  'NEET - Class 11': 'medical-bag',
  'NEET - Class 12': 'medical-bag',
  'Class 6': 'school-outline',
  'Class 7': 'school-outline',
  'Class 8': 'school-outline',
  'Class 9': 'school-outline',
  'Class 10': 'school-outline',
  'Class 11': 'school-outline',
  'Class 12': 'school-outline',
};

/**
 * Strips the class/category prefix from a topic name for display inside
 * an accordion folder.
 *
 * Examples:
 *   "Class 9 Physics"           → "Physics"
 *   "JEE Class 11 Chemistry"    → "Chemistry"
 *   "NEET Class 12 Biology"     → "Biology"
 *   "JavaScript"                → "JavaScript" (unchanged)
 */
export function getShortTopicName(fullName: string): string {
  // JEE/NEET topics: "JEE Class 11 Physics" → "Physics"
  const examMatch = fullName.match(/^(?:JEE|NEET) Class \d+\s+(.+)$/);
  if (examMatch) return examMatch[1];

  // Class topics: "Class 9 Physics" → "Physics"
  const classMatch = fullName.match(/^Class \d+\s+(.+)$/);
  if (classMatch) return classMatch[1];

  // Developer and other topics: return as-is
  return fullName;
}

/**
 * Compare function for sorting categories by the defined display order.
 * Unknown categories go last, sorted alphabetically.
 */
export function compareCategoryOrder(a: string, b: string): number {
  const indexA = CATEGORY_DISPLAY_ORDER.indexOf(a);
  const indexB = CATEGORY_DISPLAY_ORDER.indexOf(b);
  const effectiveA = indexA === -1 ? CATEGORY_DISPLAY_ORDER.length : indexA;
  const effectiveB = indexB === -1 ? CATEGORY_DISPLAY_ORDER.length : indexB;
  if (effectiveA !== effectiveB) return effectiveA - effectiveB;
  return a.localeCompare(b);
}
