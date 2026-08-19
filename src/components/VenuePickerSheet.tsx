import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { NearbyVenue, Venue } from '@/domain/venues';
import { formatVenueDistance, venueDistanceFromPoint } from '@/domain/venues';
import { useOutingSession } from '@/features/outing/OutingSessionContext';
import { venueProvider } from '@/services/venues/overpassVenueProvider';
import { colors } from '@/theme/colors';

type VenuePickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onVenueChanged?: (venue: Venue) => void;
};

function mergeNearby(primary: NearbyVenue[], secondary: NearbyVenue[]) {
  const merged = new Map<string, NearbyVenue>();
  for (const item of [...primary, ...secondary]) {
    const existing = merged.get(item.venue.id);
    if (!existing || item.distanceMeters < existing.distanceMeters) {
      merged.set(item.venue.id, item);
    }
  }
  return Array.from(merged.values()).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function VenuePickerSheet({ visible, onClose, onVenueChanged }: VenuePickerSheetProps) {
  const {
    routePoints,
    knownVenues,
    currentVenue,
    changeVenue,
    createManualVenue,
  } = useOutingSession();
  const [nearby, setNearby] = useState<NearbyVenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [manualName, setManualName] = useState('');

  const latestPoint = routePoints[routePoints.length - 1];

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    setQuery('');
    setManualName('');
    setError(null);

    const load = async () => {
      if (!latestPoint) {
        setNearby([]);
        setError('Necesitamos una posición GPS antes de buscar garitos cercanos.');
        return;
      }

      const savedNearby = knownVenues
        .map((venue) => ({ venue, distanceMeters: venueDistanceFromPoint(venue, latestPoint) }))
        .filter((item) => item.distanceMeters <= 1000);

      setLoading(true);
      try {
        const osmNearby = await venueProvider.searchNearby(latestPoint, 500);
        if (!cancelled) setNearby(mergeNearby(osmNearby, savedNearby));
      } catch (loadError) {
        if (!cancelled) {
          setNearby(savedNearby.sort((a, b) => a.distanceMeters - b.distanceMeters));
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se han podido cargar los garitos de OpenStreetMap.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [visible, latestPoint?.latitude, latestPoint?.longitude, knownVenues]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return nearby;
    return nearby.filter((item) => item.venue.name.toLocaleLowerCase('es').includes(normalized));
  }, [nearby, query]);

  const selectVenue = (venue: Venue) => {
    const stop = changeVenue(venue);
    if (!stop && currentVenue?.id !== venue.id) return;
    onVenueChanged?.(venue);
    onClose();
  };

  const createVenue = () => {
    const venue = createManualVenue(manualName);
    if (!venue) {
      setError('Para crear el garito necesitamos un nombre y una posición GPS válida.');
      return;
    }
    changeVenue(venue);
    onVenueChanged?.(venue);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>📍 GARITOS CERCA</Text>
              <Text style={styles.title}>¿Dónde estás ahora?</Text>
              <Text style={styles.subtitle}>Resultados reales alrededor del GPS · OpenStreetMap</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button">
              <Ionicons name="close" color={colors.text} size={22} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" color={colors.textMuted} size={18} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Filtrar garitos cercanos"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>

          {currentVenue ? (
            <View style={styles.currentCard}>
              <Text style={styles.currentLabel}>GARITO ACTUAL</Text>
              <Text style={styles.currentName}>{currentVenue.name}</Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.results}
            contentContainerStyle={styles.resultsContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.loadingText}>Buscando alrededor de tu posición…</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.warningCard}>
                <Ionicons name="warning-outline" color={colors.warning} size={18} />
                <Text style={styles.warningText}>{error}</Text>
              </View>
            ) : null}

            {!loading && filtered.length === 0 ? (
              <Text style={styles.emptyText}>No aparece ningún garito cercano con ese nombre.</Text>
            ) : null}

            {filtered.map((item) => (
              <Pressable
                key={item.venue.id}
                style={({ pressed }) => [styles.venueRow, pressed && styles.venueRowPressed]}
                onPress={() => selectVenue(item.venue)}
                accessibilityRole="button"
              >
                <View style={styles.venueIcon}>
                  <Text style={styles.venueEmoji}>📍</Text>
                </View>
                <View style={styles.venueCopy}>
                  <Text style={styles.venueName}>{item.venue.name}</Text>
                  <Text style={styles.venueMeta}>
                    {formatVenueDistance(item.distanceMeters)}
                    {item.venue.address ? ` · ${item.venue.address}` : ''}
                  </Text>
                </View>
                {currentVenue?.id === item.venue.id ? (
                  <Ionicons name="checkmark-circle" color={colors.success} size={22} />
                ) : (
                  <Ionicons name="chevron-forward" color={colors.textMuted} size={20} />
                )}
              </Pressable>
            ))}

            <View style={styles.manualSection}>
              <Text style={styles.manualEyebrow}>¿NO APARECE?</Text>
              <Text style={styles.manualTitle}>Añadir garito en mi ubicación</Text>
              <TextInput
                value={manualName}
                onChangeText={setManualName}
                placeholder="Nombre del garito"
                placeholderTextColor={colors.textMuted}
                style={styles.manualInput}
                maxLength={80}
              />
              <Pressable
                style={({ pressed }) => [styles.manualButton, pressed && styles.manualButtonPressed]}
                onPress={createVenue}
                accessibilityRole="button"
              >
                <Ionicons name="add" color={colors.text} size={19} />
                <Text style={styles.manualButtonText}>GUARDAR Y ENTRAR</Text>
              </Pressable>
            </View>

            <Text style={styles.attribution}>Datos de lugares: © OpenStreetMap contributors</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet: {
    maxHeight: '88%',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: { width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: colors.border },
  header: { marginTop: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.25 },
  title: { marginTop: 4, color: colors.text, fontSize: 25, fontWeight: '900' },
  subtitle: { marginTop: 4, color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
  },
  searchBox: {
    minHeight: 48,
    marginTop: 16,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 15,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  currentCard: {
    marginTop: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
  },
  currentLabel: { color: colors.success, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  currentName: { marginTop: 2, color: colors.text, fontSize: 13, fontWeight: '900' },
  results: { marginTop: 10 },
  resultsContent: { paddingBottom: 18, gap: 8 },
  loadingRow: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  loadingText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  warningCard: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
  },
  warningText: { flex: 1, color: colors.warning, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  emptyText: { paddingVertical: 16, color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  venueRow: {
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 17,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  venueRowPressed: { borderColor: colors.accent },
  venueIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.background,
  },
  venueEmoji: { fontSize: 18 },
  venueCopy: { flex: 1 },
  venueName: { color: colors.text, fontSize: 14, fontWeight: '900' },
  venueMeta: { marginTop: 2, color: colors.textMuted, fontSize: 10, lineHeight: 14 },
  manualSection: {
    marginTop: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manualEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  manualTitle: { marginTop: 3, color: colors.text, fontSize: 15, fontWeight: '900' },
  manualInput: {
    minHeight: 46,
    marginTop: 11,
    paddingHorizontal: 12,
    borderRadius: 13,
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manualButton: {
    minHeight: 48,
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  manualButtonPressed: { backgroundColor: colors.accentPressed },
  manualButtonText: { color: colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  attribution: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
  },
});
