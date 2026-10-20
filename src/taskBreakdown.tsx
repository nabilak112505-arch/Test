/**
 * F9 / R11 – Task breakdown: split a task into small, ordered sub-steps (checklist logic + UI).
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button, C, FONTS, Icon, Txt, type TaskStep } from './shared';

/* ============================== Logic ============================== */

export const MAX_STEP_LENGTH = 60;

const BADGE_COLORS = [C.lightGreen, C.yellowHl, C.pink, C.blue] as const;
const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** Trims and validates step text; returns null when empty. */
export function normalizeStepText(text: string): string | null {
  const trimmed = text.trim().replace(/\s+/g, ' ').slice(0, MAX_STEP_LENGTH);
  return trimmed ? trimmed : null;
}

export function addStep(steps: TaskStep[], text: string): TaskStep[] {
  const normalized = normalizeStepText(text);
  return normalized ? [...steps, { text: normalized, done: false }] : steps;
}

export function toggleStep(steps: TaskStep[], index: number): TaskStep[] {
  return steps.map((st, i) => (i === index ? { ...st, done: !st.done } : st));
}

export function removeStep(steps: TaskStep[], index: number): TaskStep[] {
  return steps.filter((_, i) => i !== index);
}

/** Moves a step one position earlier; no-op for the first step. */
export function moveStepUp(steps: TaskStep[], index: number): TaskStep[] {
  if (index <= 0 || index >= steps.length) return steps;
  const next = [...steps];
  const [step] = next.splice(index, 1);
  if (step) next.splice(index - 1, 0, step);
  return next;
}

export function completedCount(steps: TaskStep[]): number {
  return steps.filter((st) => st.done).length;
}

export function progressLabel(steps: TaskStep[]): string {
  return `${completedCount(steps)} of ${steps.length} complete`;
}

/** "Three small steps make it easier." */
export function encouragement(count: number): string {
  if (count === 0) return 'Add small steps to make it easier.';
  const word = NUMBER_WORDS[count] ?? String(count);
  return count === 1 ? `${word} small step makes it easier.` : `${word} small steps make it easier.`;
}

/* ============================== UI ============================== */

export interface TaskBreakdownProps {
  title: string;
  initialSteps: TaskStep[];
  onSave: (steps: TaskStep[]) => void;
}

/** Body of the "Break Down Task" screen: task summary, step checklist, add step, tip and save. */
export function TaskBreakdown({ title, initialSteps, onSave }: TaskBreakdownProps) {
  const [steps, setSteps] = useState<TaskStep[]>(initialSteps);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const submitDraft = (): void => {
    setSteps((prev) => addStep(prev, draft));
    setDraft('');
    setAdding(false);
  };

  return (
    <View>
      <View style={s.taskCard}>
        <View style={s.taskTile}><Icon name="pencilLine" size={34} stroke={1.6} /></View>
        <View style={s.flex}>
          <Txt w={700} size={11} color={C.muted} style={s.kicker}>TASK</Txt>
          <Txt w={700} size={21} style={s.taskTitle}>{title}</Txt>
          <Txt size={12}>{encouragement(steps.length)}</Txt>
        </View>
      </View>

      <View style={s.stepsHead}>
        <Txt w={700} size={14}>Steps</Txt>
        {steps.length ? <Txt size={11.5}>{progressLabel(steps)}</Txt> : null}
      </View>

      {steps.length ? (
        <View style={s.stepsCard}>
          {steps.map((st, i) => (
            <StepRow
              key={`${i}-${st.text}`}
              step={st}
              index={i}
              onToggle={() => setSteps((prev) => toggleStep(prev, i))}
              onMoveUp={() => setSteps((prev) => moveStepUp(prev, i))}
              onRemove={() => setSteps((prev) => removeStep(prev, i))}
            />
          ))}
        </View>
      ) : null}

      {adding ? (
        <View style={s.addStep}>
          <View style={s.plusCircle}><Icon name="plus" size={16} stroke={2.2} /></View>
          <TextInput
            style={s.addInput}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submitDraft}
            onBlur={submitDraft}
            placeholder="e.g. Put books away"
            placeholderTextColor={C.placeholder}
            maxLength={MAX_STEP_LENGTH}
            returnKeyType="done"
            autoFocus
            accessibilityLabel="New step"
          />
        </View>
      ) : (
        <Pressable style={s.addStep} onPress={() => setAdding(true)} accessibilityRole="button">
          <View style={s.plusCircle}><Icon name="plus" size={16} stroke={2.2} /></View>
          <Txt w={700} size={14}>Add Step</Txt>
        </Pressable>
      )}

      <View style={s.tip}>
        <Txt w={700} size={12.5} style={s.tipTitle}>Keep steps short and specific</Txt>
        <Txt size={11.5} style={s.tipLine}>Clear steps are easier to start and finish.</Txt>
        <Txt size={11.5}>Drag handles can be added in development.</Txt>
      </View>

      <Button label="Save Steps" style={s.saveBtn} onPress={() => onSave(steps)} />
    </View>
  );
}

function StepRow({ step, index, onToggle, onMoveUp, onRemove }: {
  step: TaskStep; index: number; onToggle: () => void; onMoveUp: () => void; onRemove: () => void;
}) {
  return (
    <View style={[s.stepRow, step.done ? s.stepRowDone : s.stepRowOpen, index === 0 && { marginTop: 0 }]}>
      <Pressable
        style={s.stepMain}
        onPress={onToggle}
        onLongPress={onRemove}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: step.done }}
        accessibilityLabel={step.text}
        accessibilityHint="Long press to remove"
      >
        <View style={[s.check, step.done && s.checkDone]}>
          {step.done ? <Icon name="check" size={13} stroke={3.5} color={C.white} /> : null}
        </View>
        <View style={[s.badge, { backgroundColor: BADGE_COLORS[index % BADGE_COLORS.length] }]}>
          <Txt w={700} size={12}>{index + 1}</Txt>
        </View>
        <View style={s.flex}>
          <Txt w={700} size={14}>{step.text}</Txt>
          <Txt size={11} color={C.muted} style={s.stepStatus}>{step.done ? 'Completed' : 'Not completed'}</Txt>
        </View>
      </Pressable>
      <Pressable
        style={s.moveBtn}
        onPress={onMoveUp}
        disabled={index === 0}
        accessibilityRole="button"
        accessibilityLabel={`Move ${step.text} up`}
        hitSlop={8}
      >
        <Icon name="arrowUp" size={20} stroke={1.4} color={C.placeholder} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  taskCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.blue, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14 },
  taskTile: { width: 60, height: 60, borderRadius: 12, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' },
  kicker: { letterSpacing: 0.4 },
  taskTitle: { marginTop: 1, marginBottom: 6 },
  stepsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 14 },
  stepsCard: { backgroundColor: C.white, borderRadius: 16, padding: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingLeft: 9, paddingRight: 14, marginTop: 8 },
  stepRowDone: { backgroundColor: '#F9FCF8', paddingVertical: 12 },
  stepRowOpen: { backgroundColor: '#FBFCFD', borderWidth: 1, borderColor: '#C4D1D9', paddingVertical: 20 },
  stepMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.navy, alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  checkDone: { backgroundColor: C.green, borderColor: C.green },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  stepStatus: { marginTop: 2 },
  moveBtn: { paddingLeft: 8 },
  addStep: {
    flexDirection: 'row', alignItems: 'center', gap: 12, height: 53, backgroundColor: C.white,
    borderWidth: 2, borderColor: C.green, borderRadius: 14, paddingHorizontal: 16, marginTop: 22,
  },
  plusCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.lightGreen, alignItems: 'center', justifyContent: 'center' },
  addInput: { flex: 1, height: '100%', fontFamily: FONTS[700], fontSize: 14, color: C.navy },
  tip: { backgroundColor: C.yellowHl, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 16, marginTop: 26 },
  tipTitle: { marginBottom: 8 },
  tipLine: { marginBottom: 5 },
  saveBtn: { height: 51, marginTop: 22 },
});
