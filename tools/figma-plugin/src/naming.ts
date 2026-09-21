// Figma variable name <-> token path. Both the exporter and the importer use
// these rules, so a round trip through the plugin keeps names stable.
//
//   Figma "Colors/Core/Neutral/0"        <-> token path ["color","core","neutral","0"]
//   Figma "Typography/Line Height/Body"  <-> ["font","line-height","body"]
//   Figma "Motion/Duration/Hover"        <-> ["duration","hover"]

/** Figma top-level group -> token top-level group. */
const GROUP_TO_TOKEN: Record<string, string[]> = {
  colors: ['color'],
  color: ['color'],
  space: ['space'],
  spacing: ['space'],
  radius: ['radius'],
  corners: ['radius'],
  typography: ['font'],
  font: ['font'],
  'motion/duration': ['duration'],
  'motion/ease': ['ease'],
  'motion/easing': ['ease'],
  z: ['z'],
  'z-index': ['z'],
};

/** Token top-level group -> Figma group path. */
const TOKEN_TO_GROUP: Record<string, string[]> = {
  color: ['Colors'],
  space: ['Space'],
  radius: ['Radius'],
  font: ['Typography'],
  duration: ['Motion', 'Duration'],
  ease: ['Motion', 'Ease'],
  z: ['Z'],
};

/** Token top-level group -> src file it belongs to (core tokens only). */
export const CORE_FILE_FOR_GROUP: Record<string, string> = {
  color: 'core/color.json',
  space: 'core/space.json',
  radius: 'core/radius.json',
  font: 'core/typography.json',
  duration: 'core/motion.json',
  ease: 'core/motion.json',
  z: 'core/z-index.json',
};

export const kebab = (s: string): string =>
  s
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();

export const titleCase = (s: string): string =>
  s
    .split('-')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');

export function figmaNameToPath(name: string): string[] {
  const segments = name
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length === 0) return [];

  // Try a two-segment group first (Motion/Duration), then one.
  const two = segments.length >= 2 ? kebab(`${segments[0]}/${segments[1]}`) : '';
  if (two && GROUP_TO_TOKEN[two]) {
    return [...GROUP_TO_TOKEN[two], ...segments.slice(2).map(kebab)];
  }
  const one = kebab(segments[0]);
  const head = GROUP_TO_TOKEN[one] ?? [one];
  return [...head, ...segments.slice(1).map(kebab)];
}

export function pathToFigmaName(path: string[]): string {
  if (path.length === 0) return '';
  const head = TOKEN_TO_GROUP[path[0]] ?? [titleCase(path[0])];
  return [...head, ...path.slice(1).map(titleCase)].join('/');
}

export type TokenType =
  | 'color'
  | 'dimension'
  | 'number'
  | 'fontWeight'
  | 'fontFamily'
  | 'duration'
  | 'cubicBezier'
  | 'string'
  | 'boolean';

export type FigmaResolvedType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

/** Decide the DTCG $type from where a token sits and what Figma stores. */
export function tokenTypeFor(path: string[], resolved: FigmaResolvedType): TokenType {
  const [group, sub] = path;
  if (resolved === 'COLOR') return 'color';
  if (resolved === 'BOOLEAN') return 'boolean';
  if (resolved === 'FLOAT') {
    if (group === 'space' || group === 'radius') return 'dimension';
    if (group === 'font' && sub === 'size') return 'dimension';
    if (group === 'font' && sub === 'weight') return 'fontWeight';
    if (group === 'duration') return 'duration';
    return 'number';
  }
  // STRING
  if (group === 'font' && sub === 'family') return 'fontFamily';
  if (group === 'ease') return 'cubicBezier';
  return 'string';
}

/** Inverse of tokenTypeFor: which Figma variable type holds this token. */
export function figmaTypeFor(type: TokenType): FigmaResolvedType {
  switch (type) {
    case 'color':
      return 'COLOR';
    case 'boolean':
      return 'BOOLEAN';
    case 'dimension':
    case 'number':
    case 'fontWeight':
    case 'duration':
      return 'FLOAT';
    default:
      return 'STRING';
  }
}
