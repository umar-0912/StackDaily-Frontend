/**
 * Category configuration for the accordion-based Topics page.
 * Single source of truth for folder display order, icons, and name helpers.
 */

import type { Topic } from '../types';

// ── Tech category merging ────────────────────────────────────────────────

/**
 * DB categories that are grouped into one "Computer Science" folder on the
 * Topics page. The DB categories remain separate (needed for AI prompts).
 */
export const TECH_CATEGORIES = new Set([
  'Programming Languages',
  'Frontend',
  'Backend',
  'Architecture',
  'Computer Science',
  'Cloud',
  'DevOps',
  'Databases',
]);

/** Display name shown on the merged tech accordion folder. */
export const MERGED_TECH_DISPLAY_NAME = 'Computer Science';

/**
 * Maps a DB category to its display category on the Topics page.
 * All tech categories collapse into a single "Computer Science" folder;
 * everything else keeps its DB name.
 */
export function getDisplayCategory(dbCategory: string): string {
  return TECH_CATEGORIES.has(dbCategory) ? MERGED_TECH_DISPLAY_NAME : dbCategory;
}

// ── Display order ────────────────────────────────────────────────────────

/**
 * Ordered list of DISPLAY categories for accordion sorting.
 * Categories not in this list appear last, sorted alphabetically.
 */
export const CATEGORY_DISPLAY_ORDER: string[] = [
  // Tech (merged under one folder)
  MERGED_TECH_DISPLAY_NAME,
  // English
  'English',
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

// ── Icons ────────────────────────────────────────────────────────────────

/**
 * MaterialCommunityIcons name for each DISPLAY category's accordion header.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  [MERGED_TECH_DISPLAY_NAME]: 'laptop',
  English: 'alphabetical-variant',
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

// ── Tech sub-category grouping ───────────────────────────────────────────

/**
 * Maps each tech DB category to its display sub-header name and sort order
 * inside the merged "Computer Science" accordion.
 * Categories sharing the same displayName are merged into one sub-group.
 */
export const TECH_SUBCATEGORY_CONFIG: Record<
  string,
  { displayName: string; order: number }
> = {
  'Programming Languages': { displayName: 'Programming Languages', order: 0 },
  Frontend: { displayName: 'Frontend', order: 1 },
  Backend: { displayName: 'Backend', order: 2 },
  Architecture: { displayName: 'Architecture', order: 3 },
  'Computer Science': { displayName: 'Data Structures & Algorithms', order: 4 },
  Cloud: { displayName: 'Cloud & DevOps', order: 5 },
  DevOps: { displayName: 'Cloud & DevOps', order: 5 },
  Databases: { displayName: 'Databases', order: 6 },
};

export interface TechSubGroup {
  subHeader: string;
  order: number;
  topics: Topic[];
}

/**
 * Groups tech topics by their DB category into display sub-groups for the
 * merged "Computer Science" accordion. Categories sharing the same
 * displayName (e.g., Cloud + DevOps) are merged into one sub-group.
 */
export function groupTechTopicsBySubcategory(topics: Topic[]): TechSubGroup[] {
  const groups = new Map<string, { order: number; topics: Topic[] }>();

  for (const topic of topics) {
    const config = TECH_SUBCATEGORY_CONFIG[topic.category];
    const displayName = config?.displayName ?? 'Other';
    const order = config?.order ?? 99;

    const existing = groups.get(displayName);
    if (existing) {
      existing.topics.push(topic);
    } else {
      groups.set(displayName, { order, topics: [topic] });
    }
  }

  return [...groups.entries()]
    .map(([subHeader, { order, topics: t }]) => ({ subHeader, order, topics: t }))
    .sort((a, b) => a.order - b.order || a.subHeader.localeCompare(b.subHeader));
}
