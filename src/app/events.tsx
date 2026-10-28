import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  season: string | null;
  topic: string | null;
};

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [going, setGoing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const [eventsRes, rsvpRes] = await Promise.all([
      supabase.from('events').select('*').order('starts_at'),
      supabase.from('rsvps').select('event_id').eq('user_id', userId).eq('status', 'going'),
    ]);

    if (eventsRes.error || rsvpRes.error) {
      setError(eventsRes.error?.message ?? rsvpRes.error?.message ?? 'Something went wrong');
    } else {
      setEvents(eventsRes.data);
      setGoing(new Set(rsvpRes.data.map((r) => r.event_id)));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleRsvp(eventId: string) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const isGoing = going.has(eventId);
    const { error } = await supabase.from('rsvps').upsert({
      user_id: userId,
      event_id: eventId,
      status: isGoing ? 'not_going' : 'going',
    });
    if (error) return Alert.alert('RSVP failed', error.message);

    const next = new Set(going);
    isGoing ? next.delete(eventId) : next.add(eventId);
    setGoing(next);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (error) return (
    <View style={styles.center}>
      <Text>Couldn't load events: {error}</Text>
      <Pressable onPress={load}><Text style={styles.link}>Try again</Text></Pressable>
    </View>
  );
  if (events.length === 0) return <View style={styles.center}><Text>No events yet. Check back soon!</Text></View>;

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={events}
      keyExtractor={(e) => e.id}
      onRefresh={load}
      refreshing={loading}
      renderItem={({ item }) => {
        const isGoing = going.has(item.id);
        return (
          <View style={styles.card}>
            <Text style={styles.topic}>{item.season?.toUpperCase()} · {item.topic}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{new Date(item.starts_at).toLocaleString()}</Text>
            {item.location && <Text style={styles.meta}>{item.location}</Text>}
            {item.description && <Text style={styles.desc}>{item.description}</Text>}
            <Pressable style={[styles.button, isGoing && styles.buttonGoing]} onPress={() => toggleRsvp(item.id)}>
              <Text style={styles.buttonText}>{isGoing ? "✓ Going" : 'RSVP'}</Text>
            </Pressable>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  list: { padding: 16, gap: 12, paddingTop: 60 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 4, borderWidth: 1, borderColor: '#eee' },
  topic: { fontSize: 12, color: '#c2410c', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700' },
  meta: { fontSize: 14, color: '#555' },
  desc: { fontSize: 14, marginTop: 4 },
  button: { marginTop: 10, backgroundColor: '#1e3a8a', borderRadius: 8, padding: 10, alignItems: 'center' },
  buttonGoing: { backgroundColor: '#15803d' },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#1e3a8a', fontWeight: '600' },
});


