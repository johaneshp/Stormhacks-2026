import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Button, FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { uploadPhotos } from '../api/client';
import type { Checkpoint } from '../types';

// TODO: replace with the real trip id once trip creation is wired into the flow.
const DEMO_TRIP_ID = 'demo-trip';

export default function RouteScreen() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Checkpoint | null>(null);

  async function handlePickPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      exif: true,
    });
    if (result.canceled) return;

    setLoading(true);
    try {
      const files = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? `${asset.assetId}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      }));
      const created = await uploadPhotos(DEMO_TRIP_ID, files);
      setCheckpoints(created.sort((a, b) => a.order_index - b.order_index));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Button title="Upload trip photos" onPress={handlePickPhotos} />
      {loading && <ActivityIndicator style={styles.spinner} />}

      {checkpoints.length > 0 && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: checkpoints[0].lat,
            longitude: checkpoints[0].lon,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          <Polyline coordinates={checkpoints.map((c) => ({ latitude: c.lat, longitude: c.lon }))} />
          {checkpoints.map((c) => (
            <Marker
              key={c.id}
              coordinate={{ latitude: c.lat, longitude: c.lon }}
              title={c.place_name}
              onPress={() => setSelected(c)}
            />
          ))}
        </MapView>
      )}

      <FlatList
        data={checkpoints}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => setSelected(item)}>
            <Text style={styles.rowTitle}>{item.place_name}</Text>
            <Text numberOfLines={1}>{item.summary}</Text>
          </Pressable>
        )}
      />

      <Modal visible={selected !== null} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{selected?.place_name}</Text>
          <Text style={styles.modalSummary}>{selected?.summary}</Text>
          <FlatList
            data={selected?.photos ?? []}
            keyExtractor={(p) => p.id}
            numColumns={3}
            renderItem={({ item }) => <Image source={{ uri: item.file_url }} style={styles.thumb} />}
          />
          <Button title="Close" onPress={() => setSelected(null)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  spinner: { marginTop: 12 },
  map: { height: 220 },
  row: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ddd' },
  rowTitle: { fontWeight: '600' },
  modal: { flex: 1, padding: 16, paddingTop: 48 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalSummary: { marginVertical: 8, color: '#555' },
  thumb: { width: '33%', aspectRatio: 1, margin: 1 },
});
