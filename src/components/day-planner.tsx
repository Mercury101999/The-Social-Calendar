import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { getSeason, SeasonThemes } from '@/constants/seasons';

export type PlannerEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
};

type Props = {
  date: string | null; // 'YYYY-MM-DD', or null when closed
  events: PlannerEvent[];
  onClose: () => void;
  onSaved: () => void;
};

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM

function hourLabel(h: number) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 === 0 ? 12 : h % 12} ${suffix}`;
}

export default function DayPlanner({ date, events, onClose, onSaved }: Props) {
  const [formHour, setFormHour] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState(1);
  const [saving, setSaving] = useState(false);

  if (!date) return null;

  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  const theme = SeasonThemes[getSeason(day)];
  const heading = day.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  function openForm(hour: number) {
    setFormHour(hour);
    setTitle('');
    setLocation('');
    setDuration(1);
  }

  async function save() {
    if (formHour === null) return;
    if (!title.trim()) {
      Alert.alert('Add a title', 'What are you planning?');
      return;
    }
    setSaving(true);
    const start = new Date(y, m - 1, d, formHour, 0);
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      location: location.trim() || null,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      season: getSeason(start),
    });
    setSaving(false);
    if (error) {
      Alert.alert("Couldn't save the plan", error.message);
      return;
    }
    setFormHour(null);
    onSaved();
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.back, { color: theme.accent }]}>‹ Calendar</Text>
          </Pressable>
          <Pressable
            style={[styles.addButton, { backgroundColor: theme.accent }]}
            onPress={() => openForm(12)}>
            <Text style={styles.addText}>+ Add a Plan</Text>
          </Pressable>
        </View>
        <Text style={[styles.heading, { color: theme.text }]}>{heading}</Text>

        <ScrollView contentContainerStyle={styles.timeline}>
          {HOURS.map((h) => {
            const inSlot = events.filter((e) => new Date(e.starts_at).getHours() === h);
            return (
              <View key={h} style={[styles.slot, { borderTopColor: theme.soft }]}>
                <Text style={[styles.hour, { color: theme.accent }]}>{hourLabel(h)}</Text>
                <View style={styles.slotBody}>
                  {inSlot.length === 0 ? (
                    <Pressable style={styles.empty} onPress={() => openForm(h)}>
                      <Text style={[styles.emptyText, { color: theme.text }]}>+</Text>
                    </Pressable>
                  ) : (
                    inSlot.map((e) => (
                      <View key={e.id} style={[styles.plan, { backgroundColor: theme.card, borderLeftColor: theme.accent }]}>
                        <Text style={[styles.planTitle, { color: theme.text }]}>{e.title}</Text>
                        <Text style={styles.planMeta}>
                          {new Date(e.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          {e.ends_at
                            ? ` – ${new Date(e.ends_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                            : ''}
                          {e.location ? ` · ${e.location}` : ''}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {formHour !== null && (
          <View style={[styles.form, { backgroundColor: theme.card }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>New plan at {hourLabel(formHour)}</Text>
            <TextInput style={styles.input} placeholder="What are you doing?" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Where? (optional)" value={location} onChangeText={setLocation} />
            <View style={styles.row}>
              <Text style={{ color: theme.text }}>Length</Text>
              <Pressable onPress={() => setDuration(Math.max(1, duration - 1))} style={styles.stepper}><Text>−</Text></Pressable>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{duration} hr</Text>
              <Pressable onPress={() => setDuration(Math.min(8, duration + 1))} style={styles.stepper}><Text>+</Text></Pressable>
            </View>
            <View style={styles.row}>
              <Pressable onPress={() => setFormHour(null)} style={styles.cancel}><Text>Cancel</Text></Pressable>
              <Pressable
                onPress={save}
                disabled={saving}
                style={[styles.saveButton, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]}>
                <Text style={styles.addText}>{saving ? 'Saving…' : 'Save plan'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 60 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  back: { fontSize: 17, fontWeight: '600' },
  addButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addText: { color: 'white', fontWeight: '700' },
  heading: { fontSize: 26, fontWeight: '800', paddingHorizontal: 16, marginTop: 12, marginBottom: 8 },
  timeline: { paddingHorizontal: 16, paddingBottom: 40 },
  slot: { flexDirection: 'row', borderTopWidth: 1, minHeight: 56, paddingVertical: 6 },
  hour: { width: 56, fontSize: 12, fontWeight: '700', paddingTop: 4 },
  slotBody: { flex: 1, gap: 6 },
  empty: { flex: 1, justifyContent: 'center', paddingLeft: 8 },
  emptyText: { opacity: 0.25, fontSize: 18 },
  plan: { borderRadius: 12, padding: 10, borderLeftWidth: 4 },
  planTitle: { fontWeight: '700', fontSize: 15 },
  planMeta: { color: '#6b6b6b', fontSize: 13, marginTop: 2 },
  form: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, gap: 12,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 10,
  },
  formTitle: { fontSize: 18, fontWeight: '800' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, fontSize: 15, backgroundColor: 'white' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepper: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  cancel: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#ddd' },
  saveButton: { flex: 2, padding: 14, alignItems: 'center', borderRadius: 12 },
});