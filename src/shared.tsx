/** Shared types, colors, icons, UI building blocks, categories and formatting. */
import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ============================== Types ============================== */

export type CategoryKey = 'school' | 'learning' | 'health' | 'home' | 'meals' | 'other';
export type RepeatOption = 'none' | 'daily' | 'weekdays' | 'weekly';

export interface TaskStep {
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: CategoryKey;
  /** Optional per-task tile overrides (used by the reference task list). */
  icon?: IconName;
  tileColor?: string;
  /** ISO date, e.g. "2026-10-04". */
  date: string;
  /** 24h time, e.g. "07:30". */
  time: string;
  /** F15 – estimated duration in minutes. */
  duration: number;
  repeat: RepeatOption;
  assignee: string;
  reminder: string;
  completed: boolean;
  steps: TaskStep[];
}

export type NewTask = Partial<Omit<Task, 'id'>> & Pick<Task, 'title'>;
export type TaskPatch = Partial<Omit<Task, 'id'>>;

/* ============================== Colors & fonts ============================== */

export const C = {
  bg: '#FEF9F1',
  white: '#FFFFFF',
  blue: '#E0EBF4',
  paleYellow: '#FDF3CB',
  yellowHl: '#FCF1BD',
  green: '#75A67C',
  lightGreen: '#E6F1E0',
  greenAccent: '#B1D4A6',
  pink: '#F2D9D3',
  yellow: '#F8D87B',
  gray: '#E5E5E5',
  navy: '#2E3B4E',
  muted: '#5D6B7A',
  icon: '#4D5B6B',
  danger: '#A8433B',
  border: '#D9DEE4',
  placeholder: '#9AA3AD',
  chip: '#F1F2F3',
} as const;

export type Weight = 400 | 500 | 600 | 700 | 800;

export const FONTS: Record<Weight, string> = {
  400: 'Inter_400Regular',
  500: 'Inter_500Medium',
  600: 'Inter_600SemiBold',
  700: 'Inter_700Bold',
  800: 'Inter_800ExtraBold',
};

export interface TxtProps extends TextProps {
  w?: Weight;
  size?: number;
  color?: string;
}

/** Text in the app font (Inter) and navy by default. */
export function Txt({ w = 400, size = 13, color = C.navy, style, ...rest }: TxtProps) {
  return <Text {...rest} style={[{ fontFamily: FONTS[w], fontSize: size, color }, style]} />;
}

/* ============================== Icons ============================== */

const PATHS = {
  back: '<path d="M20 12H4"/><path d="M10 6l-6 6 6 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>',
  filter: '<path d="M12 3v18"/><path d="M7 8h10"/><path d="M7 15h10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  stopwatch: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V10"/><path d="M9.5 2.5h5"/><path d="M12 2.5V6"/><path d="M18.5 6.5l1.5-1.5"/>',
  arrowRight: '<path d="M4 12h15"/><path d="M14 7l5 5-5 5"/>',
  arrowUp: '<path d="M12 20V4"/><path d="M6 10l6-6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pencilLine: '<path d="M5 19.5L16.5 4.5l2.5 2L9 19.5"/><path d="M5 19.5h10"/>',
  repeat: '<path d="M4 16a8 8 0 0 1 14.5-8.5"/><path d="M19.5 3v5h-5"/>',
  bag: '<rect x="5" y="6" width="14" height="15" rx="2.5"/><path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6"/><path d="M5 11h14"/><path d="M10 11v2.5h4V11"/>',
  bandage: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  book: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M12 5v14"/><path d="M6 9h3M6 12h3M15 9h3M15 12h3"/>',
  broom: '<path d="M20 4L9.5 14.5"/><path d="M6 11l7 7"/><path d="M8 12.5l-4.5 7.5M11 16l-7.5 4M9.5 14L5 19.5"/>',
  house: '<path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10v10h13V10"/>',
  utensils: '<path d="M7 3v18"/><path d="M4.5 3v5.5A2.5 2.5 0 0 0 7 11a2.5 2.5 0 0 0 2.5-2.5V3"/><path d="M17 21V3c-2.2 1.2-3 4-3 7s1 4 3 4"/>',
  dots: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  pencil: '<path d="M4 20l1-4.5L16 4.5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M14 6.5l3 3"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  duration: '<path d="M9 4v16"/><path d="M15 4v16"/><path d="M5 9h14"/><path d="M5 15h14"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  reset: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v5h5"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  home: '<path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.5V20h4.5v-5.5h3V20H18V9.5"/>',
  tasks: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4"/><path d="M8.5 9.5h7M8.5 13h7M8.5 16.5h4"/>',
  routines: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  progress: '<path d="M5 20v-7M10 20V9M15 20v-9M20 20V5"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  sun: '<circle cx="12" cy="12" r="8" fill="#F8D87B" stroke="none"/>',
  moon: '<path d="M19 15.5A8 8 0 0 1 9.5 4.6a8 8 0 1 0 9.5 10.9z" fill="#E0EBF4" stroke="#A9BDD0" stroke-width="1.5"/>',
} as const;

export type IconName = keyof typeof PATHS;

export interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
}

export function Icon({ name, size = 20, stroke = 2, color = C.navy }: IconProps) {
  const xml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${PATHS[name]}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} color={color} />;
}

export interface LeafProps {
  top?: number;
  right?: number;
  left?: number;
  size?: number;
  rotate?: number;
  color?: string;
}

/** Small decorative leaf, absolutely positioned inside a screen. */
export function Leaf({ top, right, left, size = 18, rotate = 0, color = C.greenAccent }: LeafProps) {
  const xml = `<svg viewBox="0 0 20 16"><path d="M1 13C3 4 11 0 19 2c-1 8-8 13-18 11z" fill="${color}"/></svg>`;
  return (
    <View style={{ position: 'absolute', top, right, left, zIndex: 0, pointerEvents: 'none', transform: [{ rotate: `${rotate}deg` }] }}>
      <SvgXml xml={xml} width={size} height={size * 0.8} />
    </View>
  );
}

/** Rounded square with a category icon (task cards, details hero, timer card). */
export function Tile({ icon, color, size = 44, iconSize = 26, radius = 10, stroke }: { icon: IconName; color: string; size?: number; iconSize?: number; radius?: number; stroke?: number }) {
  return (
    <View style={[s.tile, { width: size, height: size, borderRadius: radius, backgroundColor: color }]}>
      <Icon name={icon} size={iconSize} stroke={stroke ?? (icon === 'bandage' ? 3 : 1.8)} color={C.icon} />
    </View>
  );
}

/* ============================== Screen shell ============================== */

/** Screen background; pads for the status bar. */
export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[s.screen, { paddingTop: insets.top }]}>{children}</View>;
}

export function IconButton({ name, size = 24, onPress, label }: { name: IconName; size?: number; onPress?: () => void; label: string }) {
  return (
    <Pressable style={s.iconBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      <Icon name={name} size={size} />
    </Pressable>
  );
}

export interface HeaderProps {
  title: string;
  onBack?: () => void;
  large?: boolean;
  actions?: ReactNode;
}

export function Header({ title, onBack, large = false, actions }: HeaderProps) {
  return (
    <View style={s.header}>
      <View style={s.headerSide}>{onBack ? <IconButton name="back" onPress={onBack} label="Back" /> : null}</View>
      <Txt w={700} size={large ? 21 : 19} style={s.headerTitle} accessibilityRole="header">{title}</Txt>
      <View style={[s.headerSide, s.headerRight]}>{actions}</View>
    </View>
  );
}

type NavKey = 'home' | 'tasks' | 'routines' | 'progress' | 'profile';

const NAV_ITEMS: { key: NavKey; label: string; icon: IconName; bold?: boolean }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'tasks', label: 'Tasks', icon: 'tasks' },
  { key: 'routines', label: 'Routines', icon: 'routines' },
  { key: 'progress', label: 'Progress', icon: 'progress', bold: true },
  { key: 'profile', label: 'Profile', icon: 'profile' },
];

export function BottomNav({ onTasks }: { onTasks: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bottomNav, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      {NAV_ITEMS.map((item) => {
        const active = item.key === 'tasks';
        const color = active ? C.green : C.navy;
        return (
          <Pressable key={item.key} style={s.navItem} onPress={active ? onTasks : undefined} accessibilityRole="button">
            <Icon name={item.icon} size={22} stroke={1.8} color={color} />
            <Txt w={item.bold ? 700 : 500} size={10} color={color}>{item.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export interface ButtonProps {
  label: string;
  icon?: IconName;
  variant?: 'primary' | 'outline';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  size?: number;
}

export function Button({ label, icon, variant = 'primary', onPress, style, size = 15 }: ButtonProps) {
  const color = variant === 'primary' ? C.white : C.navy;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.btn, variant === 'primary' ? s.btnPrimary : s.btnOutline, pressed && { opacity: 0.9 }, style]}
    >
      {icon ? <Icon name={icon} size={18} color={color} /> : null}
      <Txt w={700} size={size} color={color}>{label}</Txt>
    </Pressable>
  );
}

/* ============================== Mascot decoration ============================== */

const MASCOT_XML = `<svg viewBox="0 0 390 150" preserveAspectRatio="xMidYMax meet">
  <path d="M0 105 C70 80 140 92 210 108 C280 124 340 98 390 88 V150 H0z" fill="#E0EBF4"/>
  <path d="M0 118 C60 96 120 104 190 122 C250 136 320 120 390 110 V150 H0z" fill="#B1D4A6"/>
  <path d="M0 134 C80 122 160 128 240 138 C300 145 350 140 390 134 V150 H0z" fill="#E6F1E0"/>
  <path d="M22 140 C24 118 30 104 40 92" stroke="#75A67C" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M30 116 C14 112 8 100 10 90 C22 94 30 104 30 116z" fill="#75A67C"/>
  <path d="M34 108 C46 100 58 102 64 108 C54 116 42 116 34 108z" fill="#B1D4A6"/>
  <circle cx="41" cy="88" r="4" fill="#F8D87B"/>
  <circle cx="41" cy="82" r="3" fill="#F2D9D3"/><circle cx="46" cy="87" r="3" fill="#F2D9D3"/>
  <circle cx="36" cy="87" r="3" fill="#F2D9D3"/><circle cx="41" cy="92" r="3" fill="#F2D9D3"/>
  <circle cx="41" cy="87" r="2.2" fill="#F8D87B"/>
  <path d="M86 74 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.8 -7 3.8 1.5 -7.5 -5.5 -5 7.5 -1z" fill="#F8D87B"/>
  <g transform="translate(250 20)">
    <path d="M14 28 L8 6 L28 20z" fill="#9FC796"/>
    <path d="M70 28 L78 6 L58 20z" fill="#9FC796"/>
    <ellipse cx="42" cy="44" rx="34" ry="28" fill="#A8CF9C"/>
    <path d="M14 56 C10 90 18 118 42 120 C66 118 74 90 70 56z" fill="#A8CF9C"/>
    <ellipse cx="30" cy="44" rx="4" ry="5" fill="#2E3B4E"/>
    <ellipse cx="54" cy="44" rx="4" ry="5" fill="#2E3B4E"/>
    <circle cx="31.5" cy="42" r="1.4" fill="#fff"/><circle cx="55.5" cy="42" r="1.4" fill="#fff"/>
    <ellipse cx="22" cy="54" rx="5" ry="3" fill="#F2B8AE"/>
    <ellipse cx="62" cy="54" rx="5" ry="3" fill="#F2B8AE"/>
    <path d="M37 54 Q42 59 47 54" stroke="#2E3B4E" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M42 64 l9 18 20 3 -14.5 14 3.5 20 -18 -9.5 -18 9.5 3.5 -20 -14.5 -14 20 -3z" fill="#F8D87B" stroke="#E9BE4F" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="22" cy="92" rx="8" ry="10" fill="#9FC796"/>
    <ellipse cx="62" cy="92" rx="8" ry="10" fill="#9FC796"/>
  </g>
</svg>`;

/** Decorative hills + mascot holding a star, as in the reference task list. */
export function MascotScene() {
  return (
    <View style={s.mascot} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SvgXml xml={MASCOT_XML} width="100%" height="100%" />
    </View>
  );
}

/* ============================== Categories ============================== */

export interface Category {
  label: string;
  routine: string;
  icon: IconName;
  color: string;
}

export const CATEGORIES: Record<CategoryKey, Category> = {
  school: { label: 'School', routine: 'School routine', icon: 'bag', color: '#F8D87B' },
  learning: { label: 'Learning', routine: 'Learning', icon: 'book', color: '#E0EBF4' },
  health: { label: 'Self care', routine: 'Self care', icon: 'bandage', color: '#F2D9D3' },
  home: { label: 'Home', routine: 'Home routine', icon: 'house', color: '#E6F1E0' },
  meals: { label: 'Meals', routine: 'Meal time', icon: 'utensils', color: '#E0EBF4' },
  other: { label: 'Other', routine: 'Other', icon: 'dots', color: '#E0EBF4' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

export function getCategory(key: CategoryKey): Category {
  return CATEGORIES[key] ?? CATEGORIES.other;
}

/** Tile appearance for a task, allowing per-task overrides used in the reference list. */
export function taskTile(task: Task): { icon: IconName; color: string } {
  const cat = getCategory(task.category);
  return { icon: task.icon ?? cat.icon, color: task.tileColor ?? cat.color };
}

/* ============================== Formatting ============================== */

export function toISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function isoToDate(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function hhmmToDate(hhmm: string): Date {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date;
}

export type PartOfDay = 'morning' | 'afternoon' | 'evening';

export function formatTime(hhmm: string): string {
  if (!hhmm) return '';
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatDateLabel(iso: string): string {
  if (!iso) return '';
  if (iso === toISODate()) return 'Today';
  if (iso === toISODate(new Date(Date.now() + 86400000))) return 'Tomorrow';
  const date = isoToDate(iso);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

const REPEAT_LABELS: Record<RepeatOption, string> = {
  none: 'Does not repeat',
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekly: 'Weekly',
};

export function formatRepeat(repeat: RepeatOption): string {
  return REPEAT_LABELS[repeat] ?? REPEAT_LABELS.none;
}

export function partOfDay(hhmm: string): PartOfDay {
  const h = Number((hhmm || '0').split(':')[0]);
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/* ============================== Styles ============================== */

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingBottom: 10, paddingHorizontal: 12, zIndex: 1 },
  headerSide: { width: 64, flexDirection: 'row' },
  headerRight: { justifyContent: 'flex-end' },
  headerTitle: { flex: 1, textAlign: 'center', letterSpacing: -0.2 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', backgroundColor: C.white,
    borderTopWidth: 1, borderTopColor: C.gray, paddingTop: 8, paddingHorizontal: 6, zIndex: 2,
  },
  navItem: { alignItems: 'center', gap: 4, minWidth: 56 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 14 },
  btnPrimary: { backgroundColor: C.green },
  btnOutline: { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.navy },
  tile: { alignItems: 'center', justifyContent: 'center' },
  mascot: { width: '100%', aspectRatio: 390 / 150, marginTop: 'auto', paddingTop: 8 },
});
