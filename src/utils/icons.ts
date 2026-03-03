import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Map of topic icon slugs (stored in DB) → valid MaterialCommunityIcons names.
 * The DB stores short slugs like "javascript", but MaterialCommunityIcons
 * requires the full name like "language-javascript".
 */
const ICON_MAP: Record<string, IconName> = {
  javascript: 'language-javascript',
  typescript: 'language-typescript',
  react: 'react',
  nodejs: 'nodejs',
  python: 'language-python',
  'system-design': 'sitemap-outline',
  'data-structures': 'file-tree',
  aws: 'aws',
  docker: 'docker',
  sql: 'database',
  mysql: 'database',
  html: 'language-html5',
  css: 'language-css3',
  go: 'language-go',
  rust: 'language-rust',
  java: 'language-java',
  kotlin: 'language-kotlin',
  swift: 'language-swift',
  git: 'git',
  kubernetes: 'kubernetes',
  mongodb: 'database',
  redis: 'database-clock',
  graphql: 'graphql',
  linux: 'linux',
};

const DEFAULT_ICON: IconName = 'book-open-variant';

/**
 * Resolve a topic's icon slug to a valid MaterialCommunityIcons name.
 * Falls back to 'book-open-variant' if the slug is unknown.
 */
export function getTopicIcon(iconSlug?: string): IconName {
  if (!iconSlug) return DEFAULT_ICON;
  return ICON_MAP[iconSlug] ?? (iconSlug as IconName) ?? DEFAULT_ICON;
}
