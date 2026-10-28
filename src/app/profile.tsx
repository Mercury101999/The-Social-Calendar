import { View, Text, Pressable, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Profile() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Profile</Text>
      <Pressable style={styles.button} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 72 },
  title: { fontSize: 28, fontWeight: '700' },
  button: { marginTop: 24, backgroundColor: '#1e3a8a', padding: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '600' },
});