import { View, Text, StyleSheet } from 'react-native';

export default function Connections() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Connections</Text>
      <Text style={styles.sub}>Best Friends, Friends, and New Connections will live here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 72 },
  title: { fontSize: 28, fontWeight: '700' },
  sub: { marginTop: 8, color: '#6b7280' },
});