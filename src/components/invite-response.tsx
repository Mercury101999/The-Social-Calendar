import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

const LABELS: Record<string, string> = {
  in: "You're in",
  suggest: "You suggested another time",
  declined: "You said not this time",
};

const TIMES = [
  { label: "9 AM", h: 9, m: 0 },
  { label: "12 PM", h: 12, m: 0 },
  { label: "3 PM", h: 15, m: 0 },
  { label: "6 PM", h: 18, m: 0 },
  { label: "7:30 PM", h: 19, m: 30 },
  { label: "9 PM", h: 21, m: 0 },
];

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

export default function InviteResponse({
  eventId,
  status,
  accent,
  onChange,
}: {
  eventId: string;
  status: string;
  accent: string;
  onChange: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const [day, setDay] = useState<Date>(tomorrow());
  const [time, setTime] = useState(TIMES[3]); // 6 PM
  const [error, setError] = useState<string | null>(null);

  function chosen() {
    const d = new Date(day);
    d.setHours(time.h, time.m, 0, 0);
    return d;
  }

  function moveDay(n: number) {
    const d = new Date(day);
    d.setDate(d.getDate() + n);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d >= today) setDay(d); // no suggesting the past
  }

  async function answer(next: string, suggested?: Date) {
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("invitations")
      .update({
        status: next,
        suggested_start: suggested ? suggested.toISOString() : null,
        responded_at: new Date().toISOString(),
      })
      .eq("event_id", eventId)
      .eq("invitee_id", user.id);
    if (error) {
      setError(error.message);
      return;
    }
    setPicking(false);
    onChange();
  }

  if (status !== "pending" && !picking) {
    return (
      <View style={styles.box}>
        <Text style={styles.muted}>
          {LABELS[status] ?? status}
          {status !== "in" && (
            <Text
              style={[styles.link, { color: accent }]}
              onPress={() => answer("in")}
            >
              {"  ·  "}Change to I'm in
            </Text>
          )}
        </Text>
      </View>
    );
  }

  if (picking) {
    return (
      <View style={styles.box}>
        <View style={styles.row}>
          <Pressable onPress={() => moveDay(-1)} style={styles.step}>
            <Text style={[styles.stepText, { color: accent }]}>−</Text>
          </Pressable>
          <Text style={styles.day}>
            {day.toLocaleDateString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Pressable onPress={() => moveDay(1)} style={styles.step}>
            <Text style={[styles.stepText, { color: accent }]}>+</Text>
          </Pressable>
        </View>

        <View style={styles.chips}>
          {TIMES.map((t) => (
            <Pressable
              key={t.label}
              onPress={() => setTime(t)}
              style={[
                styles.chip,
                { borderColor: accent },
                time.label === t.label && { backgroundColor: accent },
              ]}
            >
              <Text style={{ color: time.label === t.label ? "#fff" : accent }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.muted}>
          Suggest:{" "}
          {chosen().toLocaleString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>

        <View style={styles.row}>
          <Pressable onPress={() => answer("suggest", chosen())}>
            <Text style={[styles.link, { color: accent }]}>
              Send suggestion
            </Text>
          </Pressable>
          <Pressable onPress={() => setPicking(false)}>
            <Text style={styles.muted}>Cancel</Text>
          </Pressable>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Pressable onPress={() => answer("in")}>
        <Text style={[styles.link, { color: accent }]}>I'm in</Text>
      </Pressable>
      <Pressable onPress={() => setPicking(true)}>
        <Text style={[styles.link, { color: accent }]}>
          Suggest another time
        </Text>
      </Pressable>
      <Pressable onPress={() => answer("declined")}>
        <Text style={styles.muted}>Not this time</Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 6, gap: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  step: { paddingHorizontal: 14, paddingVertical: 4 },
  stepText: { fontSize: 22, fontWeight: "700" },
  day: { fontSize: 16, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  link: { fontWeight: "600" },
  muted: { color: "#888" },
  error: { color: "#c0392b" },
});
