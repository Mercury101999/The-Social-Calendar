import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { getSeason, SeasonThemes } from '@/constants/seasons';

type Category = 'new' | 'friend' | 'best_friend';
type Person = {
  connection_id: string;
  other_id: string;
  display_name: string | null;
  status: 'pending' | 'accepted';
  i_sent_it: boolean;
  category: Category;
};
type SearchResult = { id: string; display_name: string | null };

const GROUPS: { key: Category; label: string }[] = [
  { key: 'best_friend', label: 'Best Friend Cards' },
  { key: 'friend', label: 'Friend Cards' },
  { key: 'new', label: 'New Connection Cards' },
];

function initials(name: string | null) {
  return (name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Connections() {
  const theme = SeasonThemes[getSeason()];
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('my_connections');
    if (error) Alert.alert("Couldn't load connections", error.message);
    else setPeople(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function search() {
    if (!query.trim()) return setResults([]);
    const { data, error } = await supabase.rpc('search_people', { q: query.trim() });
    if (error) Alert.alert('Search failed', error.message);
    else setResults(data ?? []);
  }

  async function sendRequest(id: string) {
    const { error } = await supabase.from('connections').insert({ addressee_id: id });
    if (error) Alert.alert("Couldn't send request", error.message.includes('duplicate') ? 'You already sent one.' : error.message);
    setResults([]);
    setQuery('');
    load();
  }

  async function accept(p: Person) {
    const { error } = await supabase.from('connections').update({ status: 'accepted' }).eq('id', p.connection_id);
    if (error) Alert.alert("Couldn't accept", error.message);
    load();
  }

  async function remove(p: Person) {
    const { error } = await supabase.from('connections').delete().eq('id', p.connection_id);
    if (error) Alert.alert("Couldn't remove", error.message);
    load();
  }

  // Private: only you see this label, and the other person is never notified
  async function move(p: Person, category: Category) {
    const { error } = await supabase
      .from('connection_categories')
      .upsert({ other_id: p.other_id, category, updated_at: new Date().toISOString() });
    if (error) Alert.alert("Couldn't move card", error.message);
    load();
  }

  const accepted = people.filter((p) => p.status === 'accepted');
  const incoming = people.filter((p) => p.status === 'pending' && !p.i_sent_it);
  const outgoing = people.filter((p) => p.status === 'pending' && p.i_sent_it);

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.screen}>
      <Text style={[styles.title, { color: theme.text }]}>Connections</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Find people by name"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        <Pressable style={[styles.smallButton, { backgroundColor: theme.accent }]} onPress={search}>
          <Text style={styles.buttonText}>Search</Text>
        </Pressable>
      </View>
      {results.map((r) => (
        <View key={r.id} style={[styles.resultRow, { backgroundColor: theme.card }]}>
          <Text style={{ color: theme.text, flex: 1 }}>{r.display_name ?? 'Unnamed'}</Text>
          <Pressable onPress={() => sendRequest(r.id)}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>+ Connect</Text>
          </Pressable>
        </View>
      ))}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={theme.accent} />
      ) : (
        <>
          {incoming.length > 0 && (
            <>
              <Text style={[styles.group, { color: theme.accent }]}>Requests for you</Text>
              {incoming.map((p) => (
                <View key={p.connection_id} style={[styles.card, { backgroundColor: theme.card }]}>
                  <Avatar name={p.display_name} color={theme.accent} />
                  <Text style={[styles.name, { color: theme.text }]}>{p.display_name}</Text>
                  <Pressable style={[styles.smallButton, { backgroundColor: theme.accent }]} onPress={() => accept(p)}>
                    <Text style={styles.buttonText}>Accept</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(p)}><Text style={styles.link}>Decline</Text></Pressable>
                </View>
              ))}
            </>
          )}

          {GROUPS.map((g) => {
            const list = accepted.filter((p) => p.category === g.key);
            return (
              <View key={g.key}>
                <Text style={[styles.group, { color: theme.accent }]}>{g.label}</Text>
                {list.length === 0 ? (
                  <Text style={styles.empty}>No one here yet.</Text>
                ) : (
                  list.map((p) => (
                    <View key={p.connection_id} style={[styles.card, { backgroundColor: theme.card }]}>
                      <Avatar name={p.display_name} color={theme.accent} />
                      <View style={{ flex: 1, gap: 8 }}>
                        <Text style={[styles.name, { color: theme.text }]}>{p.display_name}</Text>
                        <View style={styles.chips}>
                          {GROUPS.filter((o) => o.key !== p.category).map((o) => (
                            <Pressable key={o.key} style={[styles.chip, { borderColor: theme.accent }]} onPress={() => move(p, o.key)}>
                              <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '600' }}>
                                Move to {o.label.replace(' Cards', '')}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            );
          })}

          {outgoing.length > 0 && (
            <>
              <Text style={[styles.group, { color: theme.accent }]}>Waiting for a reply</Text>
              {outgoing.map((p) => (
                <View key={p.connection_id} style={[styles.card, { backgroundColor: theme.card, opacity: 0.7 }]}>
                  <Avatar name={p.display_name} color={theme.accent} />
                  <Text style={[styles.name, { color: theme.text }]}>{p.display_name}</Text>
                  <Pressable onPress={() => remove(p)}><Text style={styles.link}>Cancel</Text></Pressable>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Avatar({ name, color }: { name: string | null; color: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingTop: 64, paddingBottom: 48, gap: 10 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, backgroundColor: 'white' },
  resultRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  group: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 18 },
  empty: { color: '#999', marginTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, marginTop: 8,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '800', fontSize: 16 },
  name: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10 },
  smallButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginLeft: 'auto' },
  buttonText: { color: 'white', fontWeight: '700' },
  link: { color: '#888', fontWeight: '600', marginLeft: 8 },
});