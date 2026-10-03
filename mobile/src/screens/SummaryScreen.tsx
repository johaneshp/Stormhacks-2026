import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getTripSummary } from '../api/client';
import type { TripSummary } from '../types';

const DEMO_TRIP_ID = 'demo-trip';

const DNA_LABELS: { key: keyof TripSummary['travel_dna']; label: string }[] = [
  { key: 'food', label: 'Food' },
  { key: 'sightseeing', label: 'Sightseeing' },
  { key: 'group_photo', label: 'Group photos' },
  { key: 'selfie', label: 'Selfies' },
  { key: 'street_view', label: 'Street views' },
];

export default function SummaryScreen() {
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTripSummary(DEMO_TRIP_ID)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={styles.spinner} />;
  if (!summary) return <Text style={styles.empty}>No trip summary yet. Upload some photos first.</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Your Travel DNA</Text>
      {DNA_LABELS.map(({ key, label }) => (
        <View key={key} style={styles.dnaRow}>
          <Text style={styles.dnaLabel}>{label}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${summary.travel_dna[key]}%` }]} />
          </View>
          <Text style={styles.dnaValue}>{summary.travel_dna[key]}%</Text>
        </View>
      ))}

      <Text style={styles.heading}>Core Memories</Text>
      {summary.core_memories.map((memory) => (
        <View key={`${memory.checkpoint_id}-${memory.title}`} style={styles.memoryCard}>
          {memory.photo_url && <Image source={{ uri: memory.photo_url }} style={styles.memoryPhoto} />}
          <Text style={styles.memoryTitle}>{memory.title}</Text>
          <Text style={styles.memoryPlace}>
            {memory.place_name}
            {memory.date ? ` · ${memory.date}` : ''}
          </Text>
          <Text style={styles.memoryDetail}>{memory.detail}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  spinner: { marginTop: 32 },
  empty: { margin: 16, color: '#777' },
  heading: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  dnaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dnaLabel: { width: 100 },
  barTrack: { flex: 1, height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: '#4f8ef7' },
  dnaValue: { width: 44, textAlign: 'right' },
  memoryCard: { marginBottom: 16, padding: 12, backgroundColor: '#f7f7f7', borderRadius: 12 },
  memoryPhoto: { width: '100%', height: 160, borderRadius: 8, marginBottom: 8 },
  memoryTitle: { fontWeight: '700' },
  memoryPlace: { color: '#777', marginBottom: 4 },
  memoryDetail: { color: '#333' },
});
