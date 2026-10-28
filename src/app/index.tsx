import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "../../lib/supabase";

type MyEvent = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
};

function toDateKey(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function MyCalendarScreen() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [selected, setSelected] = useState(toDateKey(new Date().toISOString()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("rsvps")
      .select("events(id, title, starts_at, location)")
      .eq("user_id", userData.user?.id)
      .eq("status", "going");

    if (error) setError(error.message);
    else setEvents((data ?? []).map((r: any) => r.events).filter(Boolean));
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
    marked[toDateKey(e.starts_at)] = { marked: true, dotColor: "#c2410c" };
  });
  marked[selected] = {
    ...(marked[selected] ?? {}),
    selected: true,
    selectedColor: "#1e3a8a",
  };

  const dayEvents = events.filter((e) => toDateKey(e.starts_at) === selected);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  if (error)
    return (
      <View style={styles.center}>
        <Text>Couldn't load your calendar: {error}</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Calendar</Text>
      <Calendar
        markedDates={marked}
        onDayPress={(d) => setSelected(d.dateString)}
      />
      <FlatList
        contentContainerStyle={styles.list}
        data={dayEvents}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {events.length === 0
              ? "You haven't RSVP'd to anything yet. Find an event on the home tab!"
              : "Nothing planned this day."}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {new Date(item.starts_at).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
            {item.location && <Text style={styles.meta}>{item.location}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: "#fff" },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  list: { padding: 16, gap: 10 },
  card: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
    gap: 2,
  },
  title: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 14, color: "#555" },
  empty: { textAlign: "center", color: "#777", marginTop: 16 },
});
