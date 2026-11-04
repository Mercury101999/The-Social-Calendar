import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

type Props = { eventId: string; endsAt: string | null; startsAt: string; accent: string; onChange?: () => void };

function localDateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DidThisHappen({ eventId, endsAt, startsAt, accent, onChange }: Props) {
  const [done, setDone] = useState<boolean | null>(null);
    const ended = new Date(endsAt ?? startsAt) < new Date();
    
  useEffect(() => {
    supabase.from('completions').select('event_id').eq('event_id', eventId).maybeSingle()
      .then(({ data }) => setDone(!!data));
  }, [eventId]);

  if (!ended || done === null) return null; // only ask after the plan ends

  async function confirm() {
    const { error } = await supabase.from('completions')
      .insert({ event_id: eventId, activity_date: localDateKey(startsAt) });
    if (error) return Alert.alert('Could not confirm', error.message);
    await supabase.from('wishes').update({ status: 'completed' }).eq('event_id', eventId);
    setDone(true); onChange?.();
  }

  async function undo() {
    const { error } = await supabase.from('completions').delete().eq('event_id', eventId);
    if (error) return Alert.alert('Could not undo', error.message);
    await supabase.from('wishes').update({ status: 'scheduled' }).eq('event_id', eventId);  
    setDone(false); onChange?.();
  }

  return done ? (
    <View style={styles.row}>
      <Text style={[styles.done, { color: accent }]}>✦ Completed</Text>
      <Pressable onPress={undo}><Text style={styles.undo}>Undo</Text></Pressable>
    </View>
  ) : (
    <View style={styles.row}>
      <Text style={styles.ask}>Did this happen?</Text>
      <Pressable onPress={confirm} style={[styles.yes, { backgroundColor: accent }]}>
        <Text style={styles.yesText}>Yes, it did</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  ask: { fontSize: 13, color: '#555' },
  yes: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  yesText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  done: { fontWeight: '700', fontSize: 13 },
  undo: { fontSize: 13, color: '#b33' },
});