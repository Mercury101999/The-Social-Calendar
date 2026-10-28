import { View, Text, StyleSheet } from 'react-native';

export default function Chats() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Chats</Text>
      <Text style={styles.sub}>Event chats appear here and are deleted when the event ends.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 72 },
  title: { fontSize: 28, fontWeight: '700' },
  sub: { marginTop: 8, color: '#6b7280' },
});