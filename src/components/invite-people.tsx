import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

type Friend = { id: string; display_name: string };
type Invite = { invitee_id: string; status: string };

const LABELS: Record<string, string> = {
  pending: 'Invited',
  in: "I'm in",
  suggest: 'Suggested another time',
  declined: 'Invited',
};

export default function InvitePeople({ eventId, accent }: { eventId: string; accent: string }) {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [f, i] = await Promise.all([
      supabase.rpc('my_friends'),
      supabase.from('invitations').select('invitee_id, status').eq('event_id', eventId),
    ]);
    if (f.error || i.error) setError((f.error ?? i.error)!.message);
    setFriends(f.data ?? []);
    setInvites(i.data ?? []);
  }

  useEffect(() => { if (open) load(); }, [open]);

  async function invite(friendId: string) {
    setError(null);
    const { error } = await supabase
      .from('invitations')
      .insert({ event_id: eventId, invitee_id: friendId });
    if (error) setError(error.message);
    load();
  }

  async function uninvite(friendId: string) {
    await supabase.from('invitations').delete()
      .eq('event_id', eventId).eq('invitee_id', friendId);
    load();
  }

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)}>
        <Text style={[styles.link, { color: accent }]}>+ Invite people</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.box}>
      {friends.length === 0 && <Text style={styles.muted}>No connections yet.</Text>}
      {friends.map((f) => {
        const inv = invites.find((x) => x.invitee_id === f.id);
        return (
          <View key={f.id} style={styles.row}>
            <Text style={styles.name}>{f.display_name}</Text>
            {inv ? (
              <Pressable onPress={() => uninvite(f.id)}>
                <Text style={styles.muted}>{LABELS[inv.status]} · Remove</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => invite(f.id)}>
                <Text style={[styles.link, { color: accent }]}>Invite</Text>
              </Pressable>
            )}
          </View>
        );
      })}
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable onPress={() => setOpen(false)}>
        <Text style={styles.muted}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 6, padding: 8, borderRadius: 8, backgroundColor: '#ffffff22', gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 15 },
  link: { fontWeight: '600', marginTop: 4 },
  muted: { color: '#888', marginTop: 2 },
  error: { color: '#c0392b' },
});