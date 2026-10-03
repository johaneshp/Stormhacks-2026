import { useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { generatePlan } from '../api/client';
import type { PlannerResponse } from '../types';

const DEMO_USER_ID = 'demo-user';

export default function PlannerScreen() {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [plan, setPlan] = useState<PlannerResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generatePlan({
        userId: DEMO_USER_ID,
        destination,
        startDate,
        endDate,
        arrivalTime: arrivalTime || undefined,
        departureTime: departureTime || undefined,
      });
      setPlan(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Destination</Text>
      <TextInput style={styles.input} value={destination} onChangeText={setDestination} placeholder="Tokyo, Japan" />

      <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2026-04-10" />

      <Text style={styles.label}>End date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2026-04-15" />

      <Text style={styles.label}>Arrival time (optional)</Text>
      <TextInput style={styles.input} value={arrivalTime} onChangeText={setArrivalTime} placeholder="14:00" />

      <Text style={styles.label}>Departure time (optional)</Text>
      <TextInput style={styles.input} value={departureTime} onChangeText={setDepartureTime} placeholder="09:00" />

      <Button
        title="Generate plan"
        onPress={handleGenerate}
        disabled={!destination || !startDate || !endDate || loading}
      />
      {loading && <ActivityIndicator style={styles.spinner} />}

      {plan?.days.map((day) => (
        <View key={day.date} style={styles.dayCard}>
          <Text style={styles.dayTitle}>{day.date}</Text>
          {day.stops.map((stop, i) => (
            <View key={i} style={styles.stopRow}>
              <Text style={styles.stopTime}>{stop.time}</Text>
              <View style={styles.stopBody}>
                <Text style={styles.stopPlace}>{stop.place_name}</Text>
                <Text style={styles.stopReason}>{stop.reason}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { marginTop: 10, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  spinner: { marginTop: 16 },
  dayCard: { marginTop: 20, padding: 12, backgroundColor: '#f7f7f7', borderRadius: 12 },
  dayTitle: { fontWeight: '700', marginBottom: 8 },
  stopRow: { flexDirection: 'row', marginBottom: 8 },
  stopTime: { width: 60, fontWeight: '600' },
  stopBody: { flex: 1 },
  stopPlace: { fontWeight: '600' },
  stopReason: { color: '#555' },
});
