import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getSeason, SeasonThemes } from '@/constants/seasons';


type Budget = 'spend_nothing' | 'simple' | 'splurge';
type Listing = { id: string; title: string; budget: Budget; location: string | null; price_note: string | null; source_url: string | null };
type Wish = { id: string; title: string; status: string; listing_id: string | null };

const BUDGETS: { key: Budget; label: string }[] = [
  { key: 'spend_nothing', label: 'Spend Nothing' },
  { key: 'simple', label: 'Simple' },
  { key: 'splurge', label: 'Splurge' },
];

export default function Compass() {
  const season = getSeason(new Date());
  const theme = SeasonThemes[season];
  const year = new Date().getFullYear();

  const [budget, setBudget] = useState<Budget>('spend_nothing');
  const [listings, setListings] = useState<Listing[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [newWish, setNewWish] = useState('');

  const load = useCallback(async () => {
    const [l, w] = await Promise.all([
      supabase.from('compass_listings').select('id,title,budget,location,price_note,source_url').eq('season', season),
      supabase.from('wishes').select('id,title,status,listing_id').eq('season', season).eq('year', year).order('created_at'),
    ]);
    if (l.error || w.error) return Alert.alert('Could not load Compass', (l.error ?? w.error)!.message);
    setListings(l.data ?? []);
    setWishes(w.data ?? []);
  }, [season, year]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function addWish(title: string, listingId: string | null = null) {
    const t = title.trim();
    if (!t) return;
    const { error } = await supabase.from('wishes').insert({ title: t, season, year, listing_id: listingId });
    if (error) return Alert.alert('Could not save wish', error.message);
    setNewWish('');
    load();
  }

  async function removeWish(id: string) {
    const { error } = await supabase.from('wishes').delete().eq('id', id);
    if (error) return Alert.alert('Could not remove wish', error.message);
    load();
    }
    
  const [planning, setPlanning] = useState<Wish | null>(null);
  const [planDate, setPlanDate] = useState('');
  const [planHour, setPlanHour] = useState(12);

  function openPlan(w: Wish) {
    const t = new Date(); t.setDate(t.getDate() + 1);
    setPlanDate(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`);
    setPlanHour(12);
    setPlanning(w);
  }

  async function savePlan() {
    if (!planning) return;
    const start = new Date(`${planDate}T${String(planHour).padStart(2, '0')}:00:00`);
    if (isNaN(start.getTime())) return Alert.alert('Check the date', 'Use the format YYYY-MM-DD.');
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const { data, error } = await supabase.from('events')
      .insert({ title: planning.title, starts_at: start.toISOString(), ends_at: end.toISOString(), season: getSeason(start) })
      .select('id').single();
    if (error) return Alert.alert('Could not create plan', error.message);
    const { error: wErr } = await supabase.from('wishes')
      .update({ status: 'scheduled', event_id: data.id }).eq('id', planning.id);
    if (wErr) return Alert.alert('Plan saved, but the wish was not linked', wErr.message);
    setPlanning(null);
    load();
  }

  const saved = new Set(wishes.map(w => w.listing_id).filter(Boolean));
  const shown = listings.filter(l => l.budget === budget);

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.page}>
      <Text style={[styles.title, { color: theme.text }]}>{theme.emoji} Compass</Text>
      <Text style={[styles.sub, { color: theme.text }]}>Events of the Season</Text>

      {/* Seasonal Wishlist */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.h2, { color: theme.text }]}>{theme.name} {year} Wishlist</Text>
        <Text style={styles.private}>Only you can see this</Text>
              {wishes.length === 0 && <Text style={styles.empty}>No wishes yet. What do you want to do this season?</Text>}
              
            {wishes.map(w => (
          <View key={w.id} style={styles.row}>
            <Text style={[styles.rowText, { color: theme.text }]}>
              {w.status === 'scheduled' ? '✩ ' : '☆ '}{w.title}{w.status === 'scheduled' ? '  · Upcoming' : ''}
            </Text>
            {w.status === 'saved' && (
              <Pressable onPress={() => openPlan(w)}><Text style={[styles.remove, { color: theme.accent }]}>Plan This</Text></Pressable>
            )}
            <Pressable onPress={() => removeWish(w.id)}><Text style={styles.remove}>Remove</Text></Pressable>
          </View>
        ))}
        <View style={styles.row}>
          <TextInput value={newWish} onChangeText={setNewWish} placeholder="Add a wish, e.g. Go apple picking" style={styles.input} />
          <Pressable onPress={() => addWish(newWish)} style={[styles.btn, { backgroundColor: theme.accent }]}>
            <Text style={styles.btnText}>Add</Text>
          </Pressable>
        </View>
      </View>

      {/* Budget sections */}
      <View style={styles.tabs}>
        {BUDGETS.map(b => (
          <Pressable key={b.key} onPress={() => setBudget(b.key)}
            style={[styles.tab, budget === b.key && { backgroundColor: theme.accent }]}>
            <Text style={[styles.tabText, budget === b.key && { color: '#fff' }]}>{b.label}</Text>
          </Pressable>
        ))}
      </View>

      {shown.length === 0 && <Text style={styles.empty}>No ideas in this section yet.</Text>}
      {shown.map(l => (
        <View key={l.id} style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.h2, { color: theme.text }]}>{l.title}</Text>
          {!!l.location && <Text style={styles.meta}>{l.location}</Text>}
          {!!l.price_note && <Text style={styles.meta}>{l.price_note}</Text>}
          <Pressable disabled={saved.has(l.id)} onPress={() => addWish(l.title, l.id)}
            style={[styles.btn, { backgroundColor: saved.has(l.id) ? '#aaa' : theme.accent, alignSelf: 'flex-start', marginTop: 8 }]}>
            <Text style={styles.btnText}>{saved.has(l.id) ? 'In your wishlist' : 'Add to Wishlist'}</Text>
          </Pressable>
        </View>
      ))}
          
          <Modal visible={!!planning} transparent animationType="slide" onRequestClose={() => setPlanning(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0006' }}>
          <View style={[styles.card, { backgroundColor: theme.card, margin: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 20 }]}>
            <Text style={[styles.h2, { color: theme.text }]}>Plan: {planning?.title}</Text>
            <TextInput value={planDate} onChangeText={setPlanDate} placeholder="YYYY-MM-DD" style={styles.input} />
            <View style={styles.row}>
              <Pressable onPress={() => setPlanHour(h => Math.max(7, h - 1))}><Text style={styles.h2}>−</Text></Pressable>
              <Text style={{ color: theme.text }}>Starts at {planHour % 12 || 12}{planHour < 12 ? ' AM' : ' PM'}</Text>
              <Pressable onPress={() => setPlanHour(h => Math.min(22, h + 1))}><Text style={styles.h2}>+</Text></Pressable>
            </View>
            <Pressable onPress={savePlan} style={[styles.btn, { backgroundColor: theme.accent }]}>
              <Text style={[styles.btnText, { textAlign: 'center' }]}>Save to Calendar</Text>
            </Pressable>
            <Pressable onPress={() => setPlanning(null)}><Text style={[styles.remove, { textAlign: 'center' }]}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 60, gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  sub: { fontSize: 15, opacity: 0.7, marginBottom: 4 },
  card: { borderRadius: 16, padding: 14, gap: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  h2: { fontSize: 17, fontWeight: '600' },
  private: { fontSize: 12, color: '#777' },
  empty: { color: '#777', fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowText: { fontSize: 15, flex: 1 },
  remove: { color: '#b33', fontSize: 13 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10, backgroundColor: '#fff' },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e6e6e6', alignItems: 'center' },
  tabText: { fontWeight: '600', color: '#333' },
  meta: { color: '#666', fontSize: 13 },
});