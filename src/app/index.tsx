import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../lib/supabase';
import { getSeason, SeasonThemes } from '@/constants/seasons';
import DayPlanner from '@/components/day-planner';

type MyEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
};

function toDateKey(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function MyCalendarScreen() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [selected, setSelected] = useState(toDateKey(new Date().toISOString()));
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plannerDate, setPlannerDate] = useState<string | null>(null);

  // The theme follows the month you're looking at
  const season = getSeason(visibleMonth);
  const theme = SeasonThemes[season];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const [rsvpRes, ownRes] = await Promise.all([
      supabase
        .from('rsvps')
        .select('events(id, title, starts_at, ends_at, location)')
        .eq('user_id', userId)
        .eq('status', 'going'),
      supabase
        .from('events')
        .select('id, title, starts_at, ends_at, location')
        .eq('created_by', userId),
    ]);

    const err = rsvpRes.error ?? ownRes.error;
    if (err) {
      setError(err.message);
    } else {
      const all = [
        ...(rsvpRes.data ?? []).map((r: any) => r.events).filter(Boolean),
        ...(ownRes.data ?? []),
      ];
      // Remove duplicates in case you RSVP'd to your own plan
      const unique = Array.from(new Map(all.map((e) => [e.id, e])).values());
      setEvents(unique);
    }
    setLoading(false);
  }, []);

  // Reload every time the tab is opened, so new RSVPs show up
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const marked: Record<string, any> = {};
  events.forEach((e) => {
    marked[toDateKey(e.starts_at)] = { marked: true, dotColor: theme.accent };
  });
  marked[selected] = {
    ...(marked[selected] ?? {}),
    selected: true,
    selectedColor: theme.accent,
  };

  const dayEvents = events.filter((e) => toDateKey(e.starts_at) === selected);

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  if (error)
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Couldn't load your calendar: {error}</Text>
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.season, { color: theme.accent }]}>
          {theme.emoji} {theme.name} {visibleMonth.getFullYear()}
        </Text>
        <Text style={[styles.heading, { color: theme.text }]}>My Calendar</Text>
      </View>

      <View style={[styles.calendarCard, { backgroundColor: theme.card }]}>
        <Calendar
          key={season}
          current={`${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, '0')}-01`}
          markedDates={marked}
          onDayPress={(d) => {
            setSelected(d.dateString);
            setPlannerDate(d.dateString);
          }}
          onMonthChange={(m) => setVisibleMonth(new Date(m.year, m.month - 1, 1))}
          theme={{
            calendarBackground: theme.card,
            monthTextColor: theme.text,
            textMonthFontWeight: '700',
            textMonthFontSize: 18,
            arrowColor: theme.accent,
            todayTextColor: theme.accent,
            dayTextColor: theme.text,
            textSectionTitleColor: theme.accent,
            selectedDayBackgroundColor: theme.accent,
          }}
        />
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={dayEvents}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.text }]}>
            {events.length === 0
              ? "You haven't RSVP'd to anything yet. Find one in the Events tab!"
              : 'Nothing planned this day.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card, borderLeftColor: theme.accent }]}>
            <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
            <Text style={styles.meta}>
              {new Date(item.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
            {item.location && <Text style={styles.meta}>{item.location}</Text>}
          </View>
        )}
      />
      

      <DayPlanner
        date={plannerDate}
        events={events.filter((e) => toDateKey(e.starts_at) === plannerDate)}
        onClose={() => setPlannerDate(null)}
        onSaved={load}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { paddingHorizontal: 16, marginBottom: 12 },
  season: { fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  heading: { fontSize: 28, fontWeight: '800', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  calendarCard: {
    marginHorizontal: 12,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 14, padding: 14, borderLeftWidth: 5, gap: 2 },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 14, color: '#6b6b6b' },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 16 },
});