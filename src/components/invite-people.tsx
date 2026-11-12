import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

type Friend = { id: string; display_name: string };
type Invite = { invitee_id: string; status: string; suggested_start: string | null };

const LABELS: Record<string, string> = {
  pending: 'Invited',
  in: "I'm in",
  suggest: 'Suggested',
};

export default function InvitePeople({
  eventId,
  accent,
  onChange,
}: {
  eventId: string;
  accent: string;
  onChange?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [f, i] = await Promise.all([
      supabase.rpc('my_friends'),
      supabase.rpc('host_invitations', { eid: eventId }),
    ]);
    if (f.error || i.error) setError((f.error ?? i.error)!.message);
    setFriends(f.data ?? []);
    setInvites(i.data ?? []);
  }

  useEffect(() => { load(); }, [eventId]);

  async function invite(friendId: string) {
    setError(null);
    const { error } = await supabase
      .from('invitations')
      .insert({ event_id: eventId, invitee_id: friendId });
    if (error) setError(error.message);
    load();
  }

  async function uninvite(friendId: string) {
    setError(null);
    const { error } = await supabase.rpc('remove_invite', { eid: eventId, person: friendId });
    if (error) setError(error.message);
    load();
  }

  async function acceptTime(friendId: string) {
    setError(null);
    const { error } = await supabase.rpc('accept_suggestion', { eid: eventId, person: friendId });
    if (error) setError(error.message);
    load();
    onChange?.(); // the plan moved, so reload the calendar
    }
    
    if (!open) {
        const suggestions = invites.filter((x) => x.status === 'suggest' && x.suggested_start);
        return (
            <View>
                {suggestions.map((s) => {
                    const name = friends.find((f) => f.id === s.invitee_id)?.display_name ?? 'Someone';
                    return (
                        <Pressable key={s.invitee_id} onPress={() => acceptTime(s.invitee_id)}>
                            <Text style={[styles.link, { color: accent }]}>
                                {name} suggested {new Date(s.suggested_start!).toLocaleString([], {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                    hour: 'numeric', minute: '2-digit',
                                })} · Move plan
                            </Text>
                        </Pressable>
                    );
                })}
                <Pressable onPress={() => setOpen(true)}>
                    <Text style={[styles.link, { color: accent }]}>+ Invite people</Text>
                </Pressable>
            </View>
        );
    }

  return (
    <View style={styles.box}>
      {friends.length === 0 && <Text style={styles.muted}>No connections yet.</Text>}
      {friends.map((f) => {
        const inv = invites.find((x) => x.invitee_id === f.id);
        return (
          <View key={f.id} style={styles.person}>
            <View style={styles.row}>
              <Text style={styles.name}>{f.display_name}</Text>
              {inv ? (
                <Pressable onPress={() => uninvite(f.id)}>
                  <Text style={styles.muted}>{LABELS[inv.status] ?? 'Invited'} · Remove</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => invite(f.id)}>
                  <Text style={[styles.link, { color: accent }]}>Invite</Text>
                </Pressable>
              )}
            </View>
            {inv?.status === 'suggest' && inv.suggested_start && (
              <Pressable onPress={() => acceptTime(f.id)}>
                <Text style={[styles.link, { color: accent }]}>
                  Move plan to {new Date(inv.suggested_start).toLocaleString([], {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </Text>
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
  person: { gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 15 },
  link: { fontWeight: '600', marginTop: 4 },
  muted: { color: '#888', marginTop: 2 },
  error: { color: '#c0392b' },
});