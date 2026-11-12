import { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase'; // ← swap for your real import line

type Props = { eventId: string; status: string; accent: string; onChange: () => void };

export default function InviteResponse({ eventId, status, accent, onChange }: Props) {
  const [suggesting, setSuggesting] = useState(false);
  const [when, setWhen] = useState(''); // YYYY-MM-DD HH:MM
  const [error, setError] = useState<string | null>(null);

  async function answer(next: 'in' | 'suggest' | 'declined', suggested?: string) {
    setError(null);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('invitations')
      .update({ status: next, suggested_start: suggested ?? null, responded_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('invitee_id', u.user?.id);
    if (error) setError(error.message);
    else { setSuggesting(false); onChange(); }
  }

  function sendSuggestion() {
    const d = new Date(when.replace(' ', 'T'));
    if (isNaN(d.getTime())) { setError('Use the format 2026-11-20 18:00'); return; }
    answer('suggest', d.toISOString());
  }

  if (status !== 'pending') {
    const label = status === 'in' ? "You're in" : status === 'suggest' ? 'You suggested another time' : 'You said not this time';
    return (
      <Pressable onPress={() => answer('in')} disabled={status === 'in'}>
        <Text style={styles.muted}>{label}{status !== 'in' ? ' · Change to I\'m in' : ''}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.muted}>You're invited</Text>
      <View style={styles.row}>
        <Pressable style={[styles.btn, { backgroundColor: accent }]} onPress={() => answer('in')}>
          <Text style={styles.btnText}>I'm in</Text>
        </Pressable>
        <Pressable style={styles.btnOutline} onPress={() => setSuggesting(true)}>
          <Text>Suggest another time</Text>
        </Pressable>
        <Pressable style={styles.btnOutline} onPress={() => answer('declined')}>
          <Text>Not this time</Text>
        </Pressable>
      </View>
      {suggesting && (
        <View style={styles.row}>
          <TextInput
            value={when}
            onChangeText={setWhen}
            placeholder="2026-11-20 18:00"
            placeholderTextColor="#888"
            style={styles.input}
          />
          <Pressable onPress={sendSuggestion}>
            <Text style={{ color: accent, fontWeight: '600' }}>Send</Text>
          </Pressable>
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 6, gap: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  btn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  btnOutline: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#aaa' },
  input: { minWidth: 160, minHeight: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 8, color: '#222' },
  error: { color: '#c0392b' },
  muted: { color: '#888' },
});