/** Task store, navigation and the five screens. */
import React, { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View,
  type StyleProp, type ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  BottomNav, Button, C, CATEGORIES, CATEGORY_KEYS, FONTS, Header, Icon, IconButton, Leaf, MascotScene, Screen, Tile, Txt,
  formatDateLabel, formatRepeat, formatTime, getCategory, hhmmToDate, isoToDate, partOfDay, taskTile, toHHMM, toISODate,
  type CategoryKey, type IconName, type NewTask, type PartOfDay, type RepeatOption, type Task, type TaskPatch,
} from './shared';
import { DEFAULT_DURATION, DurationPicker, formatDurationLong, formatDurationShort, type DurationMinutes } from './timeDuration';
import {
  CircularTimer, LiveRemaining, TaskPlayButton, TimerControls, TimerStatus, getTaskTimer, removeTaskTimer,
  syncTaskTimerDuration, useTimerStatus,
} from './countdownTimer';
import { TaskBreakdown, progressLabel } from './taskBreakdown';

/* ============================== Task store ============================== */

const STORAGE_KEY = 'tasks-app:v1';

function seedTasks(): Task[] {
  const today = toISODate();
  return [
    {
      id: 't1', title: 'Pack school bag', description: 'Get books, lunch, and water ready.',
      category: 'school', date: today, time: '07:30', duration: DEFAULT_DURATION, repeat: 'daily',
      assignee: 'Alex', reminder: '15 minutes before', completed: false,
      steps: [{ text: 'Check homework folder', done: true }, { text: 'Add lunch and water', done: false }],
    },
    {
      id: 't2', title: 'Morning medicine', description: 'Take medicine with a glass of water.',
      category: 'health', tileColor: '#E0EBF4', date: today, time: '08:00', duration: 5, repeat: 'none',
      assignee: 'Alex', reminder: 'At task time', completed: false, steps: [],
    },
    {
      id: 't3', title: 'Finish homework', description: 'Complete math and reading worksheets.',
      category: 'learning', tileColor: '#F2D9D3', date: today, time: '16:00', duration: 30, repeat: 'none',
      assignee: 'Alex', reminder: '15 minutes before', completed: false, steps: [],
    },
    {
      id: 't4', title: 'Clean room', description: 'Put toys away and make the bed.',
      category: 'home', icon: 'broom', tileColor: '#FCF1BD', date: today, time: '17:00', duration: 15, repeat: 'none',
      assignee: 'Alex', reminder: 'At task time', completed: false,
      steps: [{ text: 'Pick up clothes', done: true }, { text: 'Make bed', done: true }, { text: 'Put books away', done: false }],
    },
    {
      id: 't5', title: 'Read for 20 minutes', description: 'Pick a favorite book and read.',
      category: 'learning', tileColor: '#F2D9D3', date: today, time: '19:00', duration: 20, repeat: 'none',
      assignee: 'Alex', reminder: 'At task time', completed: false, steps: [],
    },
  ];
}

let tasks: Task[] = [];
const storeListeners = new Set<() => void>();

async function loadTasks(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    tasks = raw ? (JSON.parse(raw) as Task[]) : seedTasks();
  } catch {
    tasks = seedTasks();
  }
}

function setTasks(next: Task[]): void {
  tasks = next;
  storeListeners.forEach((fn) => fn());
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
}

function subscribeTasks(fn: () => void): () => void {
  storeListeners.add(fn);
  return () => {
    storeListeners.delete(fn);
  };
}

function useTasks(): Task[] {
  return useSyncExternalStore(subscribeTasks, () => tasks);
}

function addTask(data: NewTask): Task {
  const task: Task = {
    id: `t${Date.now().toString(36)}`,
    description: '', category: 'school', date: toISODate(), time: '07:30',
    duration: DEFAULT_DURATION, repeat: 'none', assignee: 'Alex', reminder: 'At task time',
    completed: false, steps: [],
    ...data,
  };
  setTasks([...tasks, task]);
  return task;
}

function updateTask(id: string, patch: TaskPatch): void {
  setTasks(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
}

function deleteTask(id: string): void {
  setTasks(tasks.filter((t) => t.id !== id));
}

/* ============================== Navigation ============================== */

type Route =
  | { name: 'tasks' }
  | { name: 'create' }
  | { name: 'details'; id: string }
  | { name: 'timer'; id: string }
  | { name: 'edit'; id: string }
  | { name: 'breakdown'; id: string };

interface Nav {
  push(route: Route): void;
  replace(route: Route): void;
  back(): void;
  home(): void;
}

interface ScreenProps {
  nav: Nav;
}

interface TaskScreenProps extends ScreenProps {
  id: string;
}

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const [ready, setReady] = useState(false);
  const [stack, setStack] = useState<Route[]>([{ name: 'tasks' }]);
  const [tab, setTab] = useState<TabKey>('today');

  useEffect(() => {
    loadTasks().then(() => setReady(true));
  }, []);

  const nav = useMemo<Nav>(() => ({
    push: (route) => setStack((st) => [...st, route]),
    replace: (route) => setStack((st) => [...st.slice(0, -1), route]),
    back: () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)),
    home: () => setStack([{ name: 'tasks' }]),
  }), []);

  useEffect(() => {
    if (stack.length <= 1) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      nav.back();
      return true;
    });
    return () => sub.remove();
  }, [nav, stack.length]);

  if (!fontsLoaded || !ready) return <View style={s.fill} />;

  const route = stack[stack.length - 1] ?? { name: 'tasks' };
  const key = `${stack.length}-${route.name}-${'id' in route ? route.id : ''}`;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={s.fill}>
        {route.name === 'tasks' && <TasksScreen key={key} nav={nav} tab={tab} onTab={setTab} />}
        {route.name === 'create' && <CreateTaskScreen key={key} nav={nav} />}
        {route.name === 'details' && <TaskDetailsScreen key={key} nav={nav} id={route.id} />}
        {route.name === 'timer' && <ActiveTimerScreen key={key} nav={nav} id={route.id} />}
        {route.name === 'edit' && <EditTaskScreen key={key} nav={nav} id={route.id} />}
        {route.name === 'breakdown' && <TaskBreakdownScreen key={key} nav={nav} id={route.id} />}
      </View>
    </SafeAreaProvider>
  );
}

/** Looks up a task by id and goes home if it no longer exists (e.g. after delete). */
function useTaskOrHome(id: string, nav: Nav): Task | null {
  const task = useTasks().find((t) => t.id === id) ?? null;
  useEffect(() => {
    if (!task) nav.home();
  }, [task, nav]);
  return task;
}

function confirmDelete(title: string, onConfirm: () => void): void {
  const message = `Delete "${title}"?`;
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(message)) onConfirm();
    return;
  }
  Alert.alert('Delete Task', message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

/* ============================== Small shared pieces ============================== */

function Field({ label, value, onChangeText, placeholder, multiline = false, white = false }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; multiline?: boolean; white?: boolean;
}) {
  return (
    <View style={s.field}>
      <Txt w={600} size={11} style={s.fieldLabel}>{label}</Txt>
      <TextInput
        style={[s.input, white && s.inputWhite, multiline && s.textarea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        multiline={multiline}
        accessibilityLabel={label}
      />
    </View>
  );
}

/** Pressable row that opens the native date/time picker. */
function DateTimeField({ mode, value, onChange, style, children }: {
  mode: 'date' | 'time'; value: string; onChange: (v: string) => void; style?: StyleProp<ViewStyle>; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const date = mode === 'date' ? isoToDate(value) : hhmmToDate(value);
  const handle = (event: DateTimePickerEvent, picked?: Date): void => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && picked) onChange(mode === 'date' ? toISODate(picked) : toHHMM(picked));
  };
  return (
    <>
      <Pressable style={style} onPress={() => setOpen((o) => !o)} accessibilityRole="button">{children}</Pressable>
      {open && Platform.OS !== 'web' ? (
        <DateTimePicker value={date} mode={mode} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handle} />
      ) : null}
    </>
  );
}

function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable style={[s.toggle, on && s.toggleOn]} onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label} hitSlop={8}>
      <View style={[s.toggleKnob, on && s.toggleKnobOn]} />
    </Pressable>
  );
}

function Estimate({ minutes }: { minutes: DurationMinutes }) {
  return (
    <View style={s.estimate}>
      <Icon name="stopwatch" size={15} />
      <Txt size={12}>Estimated duration: <Txt w={700} size={12}>{formatDurationLong(minutes)}</Txt></Txt>
    </View>
  );
}

function FormError({ message }: { message: string }) {
  return message ? <Txt w={600} size={12} color={C.danger} style={s.formError}>{message}</Txt> : null;
}

/* ============================== Tasks screen ============================== */

type TabKey = 'today' | 'upcoming' | 'completed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

const SECTIONS: { key: PartOfDay; label: string; icon: IconName | null }[] = [
  { key: 'morning', label: 'Morning', icon: 'sun' },
  { key: 'afternoon', label: 'Afternoon', icon: null },
  { key: 'evening', label: 'Evening', icon: 'moon' },
];

function filterTasks(all: Task[], tab: TabKey): Task[] {
  const today = toISODate();
  return all
    .filter((t) => {
      if (tab === 'completed') return t.completed;
      if (t.completed) return false;
      return tab === 'today' ? t.date <= today : t.date > today;
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function TasksScreen({ nav, tab, onTab }: ScreenProps & { tab: TabKey; onTab: (tab: TabKey) => void }) {
  const all = useTasks();
  const list = filterTasks(all, tab);
  const sections = SECTIONS.map((sec) => ({ ...sec, tasks: list.filter((t) => partOfDay(t.time) === sec.key) }))
    .filter((sec) => sec.tasks.length > 0);

  return (
    <Screen>
      <Leaf top={98} right={14} size={18} rotate={-10} />
      <Leaf top={114} right={22} size={13} rotate={20} />
      <Leaf top={266} right={6} size={16} rotate={-25} />
      <Header
        title="Tasks"
        large
        onBack={nav.back}
        actions={<><IconButton name="search" label="Search" /><IconButton name="filter" size={22} label="Filter" /></>}
      />
      <View style={s.tabs} accessibilityRole="tablist">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable key={t.key} style={[s.tab, active && s.tabActive]} onPress={() => onTab(t.key)} accessibilityRole="tab" accessibilityState={{ selected: active }}>
              <Txt w={active ? 700 : 500} size={13} color={active ? C.white : C.navy}>{t.label}</Txt>
            </Pressable>
          );
        })}
      </View>
      <ScrollView style={s.flex} contentContainerStyle={s.tasksContent} showsVerticalScrollIndicator={false}>
        {sections.length ? sections.map((sec, i) => (
          <View key={sec.key}>
            <View style={[s.daySectionTitle, i === 0 && { marginTop: 8 }]}>
              {sec.icon ? <Icon name={sec.icon} size={20} stroke={1.5} /> : null}
              <Txt w={700} size={16}>{sec.label}</Txt>
            </View>
            {sec.tasks.map((task) => <TaskCard key={task.id} task={task} nav={nav} />)}
          </View>
        )) : <Txt size={13} color={C.muted} style={s.empty}>No tasks here yet.</Txt>}
        {tab === 'today' ? (
          <Button label="+ Create Task" size={14} style={s.addTaskBtn} onPress={() => nav.push({ name: 'create' })} />
        ) : null}
        <View style={s.mascotWrap}><MascotScene /></View>
      </ScrollView>
      <BottomNav onTasks={nav.home} />
    </Screen>
  );
}

function TaskCard({ task, nav }: { task: Task; nav: Nav }) {
  const tile = taskTile(task);
  return (
    <Pressable style={s.taskCard} onPress={() => nav.push({ name: 'details', id: task.id })} accessibilityLabel={`Open ${task.title}`}>
      <Tile icon={tile.icon} color={tile.color} />
      <View style={s.taskCardBody}>
        <Txt w={700} size={13} color={task.completed ? C.muted : C.navy} style={[s.taskTitle, task.completed && s.strike]}>{task.title}</Txt>
        <View style={s.meta}>
          <Icon name="clock" size={13} />
          <Txt size={11}>{formatTime(task.time)}</Txt>
          <Txt size={11} style={s.dot}>•</Txt>
          <Icon name="stopwatch" size={13} />
          <Txt size={11}>{formatDurationShort(task.duration)}</Txt>
          <LiveRemaining taskId={task.id} />
        </View>
        {task.repeat === 'daily' ? (
          <View style={s.repeatLine}>
            <Icon name="arrowRight" size={11} />
            <Txt size={9.5}>Repeats daily</Txt>
          </View>
        ) : null}
      </View>
      {task.completed ? null : <TaskPlayButton task={task} onOpen={() => nav.push({ name: 'timer', id: task.id })} />}
      <Pressable
        style={[s.check, task.completed && s.checkDone]}
        onPress={() => updateTask(task.id, { completed: !task.completed })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel="Mark complete"
        hitSlop={8}
      >
        {task.completed ? <Icon name="check" size={14} stroke={3} color={C.white} /> : null}
      </Pressable>
    </Pressable>
  );
}

/* ============================== Create Task screen ============================== */

function CreateTaskScreen({ nav }: ScreenProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryKey>('school');
  const [date, setDate] = useState(toISODate());
  const [time, setTime] = useState('07:30');
  const [duration, setDuration] = useState<DurationMinutes | null>(DEFAULT_DURATION);
  const [repeat, setRepeat] = useState<RepeatOption>('none');
  const [error, setError] = useState('');

  const save = (): void => {
    const trimmed = title.trim();
    if (!trimmed) { setError('Please add a task title.'); return; }
    if (!duration) { setError('Please choose how long the task takes.'); return; }
    const task = addTask({ title: trimmed, description: description.trim(), category, date, time, duration, repeat });
    nav.replace({ name: 'details', id: task.id });
  };

  return (
    <Screen>
      <Leaf top={0} right={26} size={20} rotate={15} />
      <Leaf top={22} right={14} size={18} rotate={-30} />
      <Header title="Create Task" large onBack={nav.back} />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.flex} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[s.card, s.white, s.formCard]}>
            <View style={s.formBanner}>
              <Icon name="pencil" size={22} />
              <Txt w={700} size={14}>What needs to get done?</Txt>
            </View>
            <Field label="Task title" value={title} onChangeText={setTitle} placeholder="e.g. Pack school bag" />
            <Field label="Description (optional)" value={description} onChangeText={setDescription} placeholder="Add helpful details..." multiline />
          </View>

          <Txt w={700} size={11} style={s.capsLabel}>CHOOSE A CATEGORY</Txt>
          <View style={s.categoryRow}>
            {CATEGORY_KEYS.map((key) => (
              <Pressable
                key={key}
                style={[s.categoryTile, { backgroundColor: CATEGORIES[key].color }, key === category && s.categoryTileSelected]}
                onPress={() => setCategory(key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: key === category }}
                accessibilityLabel={CATEGORIES[key].label}
              >
                <Icon name={CATEGORIES[key].icon} size={26} stroke={key === 'health' ? 3 : 1.8} color={C.icon} />
              </Pressable>
            ))}
          </View>

          <View style={[s.card, s.blue]}>
            <View style={[s.sectionHeading, { marginBottom: 8 }]}>
              <Icon name="calendar" size={20} />
              <Txt w={700} size={15}>When?</Txt>
            </View>
            <DateTimeField mode="date" value={date} onChange={setDate} style={s.whenRow}>
              <Txt size={11.5}>Date</Txt>
              <Txt size={11.5}>{formatDateLabel(date)}</Txt>
            </DateTimeField>
            <DateTimeField mode="time" value={time} onChange={setTime} style={[s.whenRow, { marginBottom: 0 }]}>
              <View style={s.whenLabel}><Icon name="clock" size={16} /><Txt size={11.5}>Time</Txt></View>
              <Txt size={11.5}>{formatTime(time)}</Txt>
            </DateTimeField>
          </View>

          <DurationPicker value={duration} onChange={setDuration} showError={!!error && !duration} />

          <View style={s.splitRow}>
            <View style={[s.card, s.pink, s.splitCard]}>
              <View style={s.headingSm}>
                <Icon name="arrowRight" size={14} />
                <Txt w={700} size={13}>Repeat?</Txt>
              </View>
              <View style={s.repeatRow}>
                <Txt size={11}>{repeat === 'daily' ? 'Repeats daily' : 'Does not repeat'}</Txt>
                <Toggle on={repeat === 'daily'} onPress={() => setRepeat(repeat === 'daily' ? 'none' : 'daily')} label="Repeat daily" />
              </View>
            </View>
            <View style={[s.card, s.green, s.splitCard]}>
              <View style={s.assignHead}>
                <View style={s.assignAvatar}><View style={s.assignAvatarDot} /></View>
                <Txt w={700} size={13}>Assign to</Txt>
              </View>
              <Txt size={11} style={s.assignName}>Alex</Txt>
            </View>
          </View>

          <FormError message={error} />
          <Button label="Save Task" style={{ marginTop: 4 }} onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/* ============================== Task Details screen ============================== */

function TaskDetailsScreen({ nav, id }: TaskScreenProps) {
  const task = useTaskOrHome(id, nav);
  if (!task) return <Screen>{null}</Screen>;

  const cat = getCategory(task.category);
  const tile = taskTile(task);
  const heroColor = tile.color === '#FCF1BD' ? '#F8D87B' : tile.color;
  const timer = getTaskTimer(task);
  const rows: { icon: IconName; label: string; value: string }[] = [
    { icon: 'plusCircle', label: 'Category', value: cat.label },
    { icon: 'calendar', label: 'Date', value: formatDateLabel(task.date) },
    { icon: 'clock', label: 'Time', value: formatTime(task.time) },
    { icon: 'duration', label: 'Duration', value: formatDurationLong(task.duration) },
    { icon: 'repeat', label: 'Repeat', value: formatRepeat(task.repeat) },
  ];

  const toggleStep = (index: number): void => {
    updateTask(task.id, { steps: task.steps.map((st, i) => (i === index ? { ...st, done: !st.done } : st)) });
  };
  const openBreakdown = (): void => nav.push({ name: 'breakdown', id: task.id });

  return (
    <Screen>
      <Header title="Task Details" onBack={nav.back} />
      <ScrollView style={s.flex} contentContainerStyle={[s.content, { paddingTop: 2 }]} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Tile icon={tile.icon} color={heroColor} size={58} iconSize={34} radius={12} stroke={tile.icon === 'bandage' ? 3 : 1.6} />
          <View style={s.flex}>
            <Txt w={700} size={10} color={C.muted} style={s.kicker}>{cat.routine.toUpperCase()}</Txt>
            <Txt w={700} size={18} style={s.heroTitle}>{task.title}</Txt>
            {task.description ? <Txt size={11}>{task.description}</Txt> : null}
            <Txt w={700} size={10} style={{ marginTop: 3 }}>Assigned to {task.assignee || 'Alex'}</Txt>
          </View>
        </View>

        <Txt w={700} size={14} style={s.groupTitle}>Task information</Txt>
        <View style={s.infoList}>
          {rows.map((r) => (
            <View key={r.label} style={s.infoRow}>
              <Icon name={r.icon} size={18} stroke={1.8} />
              <Txt w={600} size={12} style={s.flex}>{r.label}</Txt>
              <Txt size={12}>{r.value}</Txt>
            </View>
          ))}
        </View>

        <Txt w={700} size={14} style={s.groupTitle}>Countdown timer</Txt>
        <View style={s.timerCard}>
          <CircularTimer timer={timer} size={180} stroke={13} />
          <Estimate minutes={task.duration} />
          <TimerControls timer={timer} mode="details" onStart={() => nav.push({ name: 'timer', id: task.id })} />
        </View>

        <Txt w={700} size={14} style={s.groupTitle}>Reminder</Txt>
        <View style={s.reminder}>
          <View style={s.reminderIcon}><Icon name="clock" size={16} color={C.icon} /></View>
          <View>
            <Txt w={700} size={11.5}>On</Txt>
            <Txt size={10} style={{ marginTop: 1 }}>{task.reminder || 'At task time'}</Txt>
          </View>
        </View>

        <View style={[s.groupTitle, s.stepsHeading]}>
          <Txt w={700} size={14}>Steps</Txt>
          {task.steps.length ? <Txt size={11}>{progressLabel(task.steps)}</Txt> : null}
        </View>
        <View style={s.stepsCard}>
          {task.steps.map((st, i) => (
            <Pressable key={i} style={s.stepRow} onPress={() => toggleStep(i)} accessibilityRole="checkbox" accessibilityState={{ checked: st.done }}>
              <View style={[s.stepCheck, st.done && s.stepCheckDone]}>
                {st.done ? <Icon name="check" size={11} stroke={3.5} color={C.white} /> : null}
              </View>
              <Txt size={11.5}>{st.text}</Txt>
            </Pressable>
          ))}
          <Pressable style={[s.stepRow, s.breakdownLink]} onPress={openBreakdown} accessibilityRole="button">
            <Icon name="plusCircle" size={16} stroke={1.8} color={C.green} />
            <Txt w={700} size={11.5} color={C.green}>{task.steps.length ? 'Edit steps' : 'Break down task'}</Txt>
          </Pressable>
        </View>

        <Button
          label={task.completed ? 'Mark Incomplete' : 'Mark Complete'}
          style={s.completeBtn}
          onPress={() => {
            updateTask(task.id, { completed: !task.completed });
            nav.home();
          }}
        />
        <View style={s.detailsActions}>
          <Pressable style={s.chipBtn} onPress={() => nav.push({ name: 'edit', id: task.id })} accessibilityRole="button">
            <Txt w={700} size={12}>Edit Task</Txt>
          </Pressable>
          <Pressable
            style={[s.chipBtn, s.chipDanger]}
            accessibilityRole="button"
            onPress={() => confirmDelete(task.title, () => {
              nav.home();
              removeTaskTimer(task.id);
              deleteTask(task.id);
            })}
          >
            <Txt w={700} size={12} color={C.danger}>Delete Task</Txt>
          </Pressable>
        </View>
      </ScrollView>
      <BottomNav onTasks={nav.home} />
    </Screen>
  );
}

/* ============================== Active Timer screen ============================== */

function ActiveTimerScreen({ nav, id }: TaskScreenProps) {
  const task = useTaskOrHome(id, nav);
  const timer = task ? getTaskTimer(task) : null;
  const status = useTimerStatus(timer);
  if (!task || !timer) return <Screen>{null}</Screen>;
  const tile = taskTile(task);

  return (
    <Screen>
      <Leaf top={6} right={24} size={20} rotate={15} />
      <Leaf top={28} right={12} size={16} rotate={-30} />
      <Header title="Task Timer" onBack={nav.back} />
      <ScrollView style={s.flex} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.timerTaskCard}>
          <Tile icon={tile.icon} color={tile.color} />
          <View style={s.flex}>
            <Txt w={700} size={17} style={{ marginBottom: 4 }}>{task.title}</Txt>
            <View style={s.meta}>
              <Icon name="clock" size={13} />
              <Txt size={11}>{formatTime(task.time)}</Txt>
            </View>
          </View>
        </View>

        <View style={s.ringWrap}>
          <CircularTimer timer={timer} size={230} stroke={16} />
          <Estimate minutes={task.duration} />
        </View>

        <View style={{ marginTop: 16 }}>
          {status === TimerStatus.FINISHED ? (
            <View style={s.timesUp}>
              <Txt w={800} size={20}>Time&apos;s up!</Txt>
              <Txt size={12} style={{ marginTop: 2 }}>Great job working on {task.title.toLowerCase()}.</Txt>
            </View>
          ) : null}
          <TimerControls timer={timer} mode="active" />
        </View>
      </ScrollView>
    </Screen>
  );
}

/* ============================== Task Breakdown screen ============================== */

function TaskBreakdownScreen({ nav, id }: TaskScreenProps) {
  const task = useTaskOrHome(id, nav);
  if (!task) return <Screen>{null}</Screen>;
  return (
    <Screen>
      <Header title="Break Down Task" onBack={nav.back} />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.flex} contentContainerStyle={[s.content, s.breakdownContent]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TaskBreakdown
            title={task.title}
            initialSteps={task.steps}
            onSave={(steps) => {
              updateTask(task.id, { steps });
              nav.back();
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/* ============================== Edit Task screen ============================== */

const REPEAT_CYCLE: RepeatOption[] = ['none', 'daily', 'weekdays', 'weekly'];

function EditTaskScreen({ nav, id }: TaskScreenProps) {
  const task = useTaskOrHome(id, nav);
  if (!task) return <Screen>{null}</Screen>;
  return <EditTaskForm task={task} nav={nav} />;
}

function EditTaskForm({ task, nav }: { task: Task; nav: Nav }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [category, setCategory] = useState<CategoryKey>(task.category);
  const [date, setDate] = useState(task.date);
  const [time, setTime] = useState(task.time);
  const [duration, setDuration] = useState<DurationMinutes | null>(task.duration);
  const [repeat, setRepeat] = useState<RepeatOption>(task.repeat);
  const [error, setError] = useState('');

  const save = (): void => {
    const trimmed = title.trim();
    if (!trimmed) { setError('Please add a task title.'); return; }
    if (!duration) { setError('Please choose how long the task takes.'); return; }
    updateTask(task.id, { title: trimmed, description: description.trim(), category, date, time, duration, repeat });
    syncTaskTimerDuration(task.id, duration);
    nav.back();
  };

  const cycleRepeat = (): void => {
    setRepeat(REPEAT_CYCLE[(REPEAT_CYCLE.indexOf(repeat) + 1) % REPEAT_CYCLE.length] ?? 'none');
  };

  return (
    <Screen>
      <Header title="Edit Task" onBack={nav.back} />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.flex} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[s.editCard]}>
            <View style={s.editHeading}>
              <View style={s.pencilBadge}><Icon name="pencil" size={15} /></View>
              <Txt w={700} size={14}>Task information</Txt>
            </View>
            <Field label="Task title" value={title} onChangeText={setTitle} white />
            <Field label="Description" value={description} onChangeText={setDescription} white />
          </View>

          <View style={s.editCard}>
            <Txt w={700} size={14} style={s.editHeading}>Category</Txt>
            <View style={s.chipRow}>
              {CATEGORY_KEYS.map((key) => {
                const selected = key === category;
                return (
                  <Pressable key={key} style={[s.choiceChip, selected && s.choiceChipSelected]} onPress={() => setCategory(key)} accessibilityRole="radio" accessibilityState={{ checked: selected }}>
                    <Txt w={selected ? 700 : 500} size={11} color={selected ? C.white : C.navy}>{CATEGORIES[key].label}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={s.editCard}>
            <View style={s.editHeading}>
              <View style={s.squareBadge} />
              <Txt w={700} size={14}>Schedule</Txt>
            </View>
            <DateTimeField mode="date" value={date} onChange={setDate} style={[s.scheduleBox, { marginBottom: 6 }]}>
              <Txt w={700} size={11}>Date</Txt>
              <Txt size={11}>{formatDateLabel(date)}</Txt>
            </DateTimeField>
            <View style={s.scheduleSplit}>
              <View style={s.flex}>
                <DateTimeField mode="time" value={time} onChange={setTime} style={s.scheduleBox}>
                  <Txt w={700} size={11}>{formatTime(time)}</Txt>
                </DateTimeField>
              </View>
              <View style={[s.scheduleBox, s.flex]}>
                <Txt w={700} size={11}>{duration ? formatDurationLong(duration) : '—'}</Txt>
              </View>
            </View>
          </View>

          <DurationPicker value={duration} onChange={setDuration} showError={!!error && !duration} />

          <View style={s.editCard}>
            <Txt w={700} size={14} style={s.editHeading}>Assignment</Txt>
            <View style={s.assignOptions}>
              <View style={s.assignSelected}>
                <View style={s.avatar} />
                <View>
                  <Txt w={700} size={11}>{task.assignee || 'Alex'}</Txt>
                  <Txt size={9}>Selected</Txt>
                </View>
                <View style={s.assignCheck}><Icon name="check" size={10} stroke={3.5} color={C.white} /></View>
              </View>
              <Pressable style={s.assignChange} accessibilityRole="button"><Txt w={700} size={11}>Change</Txt></Pressable>
            </View>
          </View>

          <View style={[s.editCard, s.linkRows]}>
            <Pressable style={s.linkRow} onPress={cycleRepeat} accessibilityRole="button">
              <Txt w={700} size={11.5}>Repeat</Txt>
              <Txt size={11.5}>{formatRepeat(repeat)} ›</Txt>
            </Pressable>
            <View style={[s.linkRow, s.linkRowBorder]}>
              <Txt w={700} size={11.5}>Reminder</Txt>
              <Txt size={11.5}>{task.reminder || 'At task time'} ›</Txt>
            </View>
          </View>

          <FormError message={error} />
          <Button label="Save Changes" onPress={save} />
          <Pressable
            style={s.deleteText}
            accessibilityRole="button"
            onPress={() => confirmDelete(task.title, () => {
              nav.home();
              removeTaskTimer(task.id);
              deleteTask(task.id);
            })}
          >
            <Txt w={700} size={13} color={C.danger}>Delete Task</Txt>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/* ============================== Styles ============================== */

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  content: { paddingTop: 6, paddingHorizontal: 16, paddingBottom: 24, zIndex: 1 },

  card: { borderRadius: 18, padding: 12, marginBottom: 12 },
  white: { backgroundColor: C.white },
  blue: { backgroundColor: C.blue },
  pink: { backgroundColor: C.pink },
  green: { backgroundColor: C.lightGreen },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  headingSm: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  groupTitle: { marginTop: 14, marginBottom: 8 },
  capsLabel: { letterSpacing: 0.4, marginTop: 4, marginHorizontal: 4, marginBottom: 8 },

  field: { marginBottom: 10 },
  fieldLabel: { marginBottom: 6, marginLeft: 2 },
  input: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12, fontSize: 13, fontFamily: FONTS[400], color: C.navy,
  },
  inputWhite: { backgroundColor: C.white },
  textarea: { height: 46, textAlignVertical: 'top', paddingTop: 10 },
  formError: { marginHorizontal: 4, marginBottom: 8 },

  toggle: { width: 30, height: 18, borderRadius: 999, backgroundColor: '#C9CFD6', padding: 2 },
  toggleOn: { backgroundColor: C.green },
  toggleKnob: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.white },
  toggleKnobOn: { transform: [{ translateX: 12 }] },

  estimate: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 14 },

  // Tasks
  tabs: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 12, marginTop: 4, marginHorizontal: 16, marginBottom: 6, padding: 3, zIndex: 1 },
  tab: { flex: 1, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: C.green },
  tasksContent: { flexGrow: 1, paddingHorizontal: 16 },
  daySectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 8 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14,
    paddingVertical: 9, paddingLeft: 9, paddingRight: 12, marginBottom: 8,
  },
  taskCardBody: { flex: 1, minWidth: 0 },
  taskTitle: { marginBottom: 5 },
  strike: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  dot: { marginHorizontal: 3 },
  repeatLine: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#8C96A1', alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: C.green, borderColor: C.green },
  empty: { textAlign: 'center', paddingTop: 40, paddingBottom: 10 },
  addTaskBtn: { marginTop: 8, marginBottom: 4, height: 42 },
  mascotWrap: { flexGrow: 1, justifyContent: 'flex-end', marginHorizontal: -16 },

  // Create
  formCard: { paddingTop: 0, paddingHorizontal: 12, paddingBottom: 4, overflow: 'hidden' },
  formBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.paleYellow,
    marginHorizontal: -12, marginBottom: 12, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 18,
  },
  categoryRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  categoryTile: { flex: 1, aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  categoryTileSelected: { borderColor: C.green, borderWidth: 3 },
  whenRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white,
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 6,
  },
  whenLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  splitRow: { flexDirection: 'row', gap: 10 },
  splitCard: { flex: 1, minHeight: 64 },
  repeatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assignHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assignAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' },
  assignAvatarDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8A6A3A' },
  assignName: { marginTop: 4, marginLeft: 26 },

  // Details
  hero: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: C.yellowHl, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 12 },
  kicker: { letterSpacing: 0.4 },
  heroTitle: { marginTop: 1, marginBottom: 4 },
  infoList: { backgroundColor: C.white, borderRadius: 14, paddingVertical: 2, paddingHorizontal: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  timerCard: { backgroundColor: C.white, borderRadius: 14, paddingTop: 16, paddingHorizontal: 14, paddingBottom: 14 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.blue, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  reminderIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  stepsCard: { backgroundColor: C.white, borderRadius: 14, paddingVertical: 6, paddingHorizontal: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  stepCheck: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  stepCheckDone: { backgroundColor: C.green, borderColor: C.green },
  stepsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  breakdownLink: { gap: 6 },
  breakdownContent: { paddingTop: 10, paddingBottom: 32 },
  completeBtn: { marginTop: 14, height: 40, borderRadius: 12 },
  detailsActions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 4, paddingBottom: 2 },
  chipBtn: { backgroundColor: C.yellowHl, paddingVertical: 5, paddingHorizontal: 18, borderRadius: 6 },
  chipDanger: { backgroundColor: '#FCEBD9' },

  // Active timer
  timerTaskCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.yellowHl, borderRadius: 18, padding: 12 },
  ringWrap: { backgroundColor: C.white, borderRadius: 24, padding: 22, marginTop: 14 },
  timesUp: { alignItems: 'center', backgroundColor: C.yellowHl, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14 },

  // Edit
  editCard: { backgroundColor: C.white, borderRadius: 18, paddingTop: 10, paddingHorizontal: 10, paddingBottom: 8, marginBottom: 10 },
  editHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  pencilBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' },
  squareBadge: { width: 18, height: 18, borderRadius: 4, backgroundColor: C.blue, borderWidth: 1.5, borderColor: C.icon },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choiceChip: { paddingVertical: 7, paddingHorizontal: 18, borderRadius: 999, backgroundColor: C.chip },
  choiceChipSelected: { backgroundColor: C.green },
  scheduleBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10, backgroundColor: C.white,
  },
  scheduleSplit: { flexDirection: 'row', gap: 6 },
  assignOptions: { flexDirection: 'row', gap: 8 },
  assignSelected: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: C.green, borderRadius: 12,
    paddingVertical: 10, paddingLeft: 8, paddingRight: 14,
  },
  avatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.pink },
  assignCheck: { position: 'absolute', top: -5, right: -5, width: 15, height: 15, borderRadius: 8, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  assignChange: { backgroundColor: C.chip, borderRadius: 12, paddingHorizontal: 22, justifyContent: 'center' },
  linkRows: { paddingTop: 2, paddingBottom: 2 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  linkRowBorder: { borderTopWidth: 1, borderTopColor: C.chip },
  deleteText: { alignSelf: 'center', marginTop: 12, marginBottom: 4 },
});
