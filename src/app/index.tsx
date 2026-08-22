import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteMap } from '@/components/RouteMap';
import { VenuePickerSheet } from '@/components/VenuePickerSheet';
import type { BeerSize, DrinkType } from '@/domain/drinks';
import { formatDistance } from '@/domain/route';
import { buildOutingTimeline, formatTimelineTime } from '@/domain/timeline';
import {
  type LocationTrackingStatus,
  useOutingSession,
} from '@/features/outing/OutingSessionContext';
import { colors } from '@/theme/colors';

const BEER_OPTIONS: Array<{ size: BeerSize; label: string; hint: string }> = [
  { size: 'QUINTO', label: 'Quinto', hint: 'La pequeña' },
  { size: 'TERCIO', label: 'Tercio', hint: 'La de siempre' },
  { size: 'LITRONA', label: 'Litrona', hint: 'Artillería pesada' },
];

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

function getDrinkLabel(type: DrinkType, beerSize?: BeerSize) {
  if (type === 'BEER') {
    if (beerSize === 'QUINTO') return 'Quinto';
    if (beerSize === 'TERCIO') return 'Tercio';
    return 'Litrona';
  }

  if (type === 'KALIMOTXO') return 'Kalimotxo';
  if (type === 'SHOT') return 'Chupito';
  return 'Copa';
}

function getLocationStatus(status: LocationTrackingStatus) {
  if (status === 'tracking') {
    return { label: 'GPS ACTIVO', icon: 'navigate' as const, color: colors.success };
  }
  if (status === 'requesting') {
    return { label: 'BUSCANDO GPS', icon: 'locate-outline' as const, color: colors.warning };
  }
  if (status === 'denied') {
    return { label: 'SIN PERMISO', icon: 'location-outline' as const, color: colors.warning };
  }
  if (status === 'error') {
    return { label: 'ERROR GPS', icon: 'warning-outline' as const, color: colors.danger };
  }
  return { label: 'GPS EN ESPERA', icon: 'location-outline' as const, color: colors.textMuted };
}

export default function OutingScreen() {
  const {
    activeOuting,
    drinks,
    routePoints,
    stops,
    knownVenues,
    currentVenue,
    locationStatus,
    locationError,
    retryLocationTracking,
    startOuting,
    addDrink,
    undoLastDrink,
    finishOuting,
  } = useOutingSession();

  const [elapsed, setElapsed] = useState(0);
  const [beerPickerOpen, setBeerPickerOpen] = useState(false);
  const [venuePickerOpen, setVenuePickerOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [notice, setNotice] = useState('Todo listo para dejar constancia.');

  useEffect(() => {
    if (!activeOuting) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      const startedAt = new Date(activeOuting.startedAt).getTime();
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeOuting]);

  const counts = useMemo(
    () => ({
      beer: drinks.filter((drink) => drink.type === 'BEER').length,
      kalimotxo: drinks.filter((drink) => drink.type === 'KALIMOTXO').length,
      shot: drinks.filter((drink) => drink.type === 'SHOT').length,
      mixed: drinks.filter((drink) => drink.type === 'MIXED_DRINK').length,
    }),
    [drinks],
  );

  const timeline = useMemo(
    () => (activeOuting ? buildOutingTimeline(activeOuting, drinks, stops, knownVenues) : []),
    [activeOuting, drinks, knownVenues, stops],
  );

  const logDrink = (type: DrinkType, label: string, beerSize?: BeerSize) => {
    const result = addDrink({ type, beerSize });
    if (result) {
      setNotice(`${label} añadido${currentVenue ? ` · ${currentVenue.name}` : ''}.`);
    }
  };

  const addBeer = (size: BeerSize, label: string) => {
    logDrink('BEER', label, size);
    setBeerPickerOpen(false);
  };

  const handleUndo = () => {
    const removed = undoLastDrink();

    if (!removed) {
      setNotice('Todavía no hay nada que deshacer.');
      return;
    }

    setNotice(`${getDrinkLabel(removed.type, removed.beerSize)} eliminado.`);
  };

  const handleFinish = () => {
    const finished = finishOuting();
    setFinishOpen(false);
    if (finished) router.replace('/summary');
  };

  if (!activeOuting) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="moon" color={colors.accent} size={34} />
          </View>
          <Text style={styles.emptyEyebrow}>SIN SALIDA ACTIVA</Text>
          <Text style={styles.emptyTitle}>Todavía no consta nada.</Text>
          <Text style={styles.emptyText}>
            Empieza una salida y RESAKA guardará bebidas, tiempo, garitos y recorrido. Al iniciar te pediremos permiso para usar el GPS.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.startButton, pressed && styles.primaryPressed]}
            onPress={() => {
              startOuting();
              setNotice('Salida iniciada. Que conste en acta.');
            }}
            accessibilityRole="button"
          >
            <Ionicons name="play" color={colors.text} size={18} />
            <Text style={styles.startButtonText}>EMPEZAR SALIDA</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const locationUi = getLocationStatus(locationStatus);
  const latestPoint = routePoints[routePoints.length - 1];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View style={styles.topRow}>
          <View>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>SALIDA EN CURSO</Text>
            </View>
            <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.venueBadge, pressed && styles.venueBadgePressed]}
            onPress={() => setVenuePickerOpen(true)}
            accessibilityRole="button"
          >
            <Ionicons name="location-outline" color={currentVenue ? colors.accent : colors.textMuted} size={16} />
            <Text style={[styles.venueText, currentVenue && styles.venueTextActive]} numberOfLines={1}>
              {currentVenue?.name ?? 'Sin garito'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.routeSection}>
          <View style={styles.routeHeader}>
            <View>
              <Text style={styles.routeEyebrow}>RUTA EN DIRECTO</Text>
              <Text style={styles.routeDistance}>{formatDistance(activeOuting.distanceMeters)}</Text>
            </View>
            <View style={styles.gpsBadge}>
              <Ionicons name={locationUi.icon} color={locationUi.color} size={15} />
              <Text style={[styles.gpsBadgeText, { color: locationUi.color }]}>{locationUi.label}</Text>
            </View>
          </View>

          <RouteMap points={routePoints} height={220} />

          <View style={styles.routeMeta}>
            <Text style={styles.routeMetaText}>{routePoints.length} puntos guardados</Text>
            {typeof latestPoint?.accuracy === 'number' ? (
              <Text style={styles.routeMetaText}>precisión ±{Math.round(latestPoint.accuracy)} m</Text>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [styles.venueAction, pressed && styles.venueActionPressed]}
            onPress={() => setVenuePickerOpen(true)}
            accessibilityRole="button"
          >
            <View style={styles.venueActionIcon}>
              <Ionicons name="location" color={colors.accent} size={20} />
            </View>
            <View style={styles.venueActionCopy}>
              <Text style={styles.venueActionEyebrow}>{currentVenue ? 'GARITO ACTUAL' : 'SIN GARITO'}</Text>
              <Text style={styles.venueActionTitle}>{currentVenue?.name ?? '¿Dónde estás?'}</Text>
              <Text style={styles.venueActionText}>
                {currentVenue ? 'Toca para cambiar de garito.' : 'Busca bares reales alrededor de tu GPS.'}
              </Text>
            </View>
            <Text style={styles.venueActionButton}>{currentVenue ? 'CAMBIAR' : 'ELEGIR'}</Text>
          </Pressable>

          {locationStatus === 'denied' || locationStatus === 'error' ? (
            <View style={styles.gpsWarning}>
              <View style={styles.gpsWarningCopy}>
                <Text style={styles.gpsWarningTitle}>
                  {locationStatus === 'denied' ? 'No tenemos permiso de ubicación.' : 'El GPS se ha torcido.'}
                </Text>
                <Text style={styles.gpsWarningText}>
                  {locationStatus === 'denied'
                    ? 'Puedes seguir registrando bebidas. Si cambias el permiso del navegador o del móvil, pulsa reintentar.'
                    : locationError ?? 'Puedes seguir con la salida y probar de nuevo cuando quieras.'}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
                onPress={retryLocationTracking}
                accessibilityRole="button"
              >
                <Text style={styles.retryButtonText}>REINTENTAR</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>{notice}</Text>
          <Pressable onPress={handleUndo} hitSlop={10} accessibilityRole="button">
            <Text style={styles.undoText}>DESHACER</Text>
          </Pressable>
        </View>

        <View style={styles.drinkGrid}>
          <DrinkButton
            emoji="🍺"
            label="CERVEZA"
            count={counts.beer}
            onPress={() => setBeerPickerOpen(true)}
          />
          <DrinkButton
            emoji="🍷"
            label="KALIMOTXO"
            count={counts.kalimotxo}
            onPress={() => logDrink('KALIMOTXO', 'Kalimotxo')}
          />
          <DrinkButton
            emoji="🥃"
            label="CHUPITO"
            count={counts.shot}
            onPress={() => logDrink('SHOT', 'Chupito')}
          />
          <DrinkButton
            emoji="🍸"
            label="COPA"
            count={counts.mixed}
            onPress={() => logDrink('MIXED_DRINK', 'Copa')}
          />
        </View>

        <View style={styles.timelineCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>EN DIRECTO</Text>
              <Text style={styles.sectionTitle}>Timeline</Text>
            </View>
            <Text style={styles.eventCount}>{timeline.length} eventos</Text>
          </View>

          <View style={styles.timelineList}>
            {timeline
              .slice()
              .reverse()
              .slice(0, 8)
              .map((event, index) => (
                <View key={event.id} style={styles.timelineRow}>
                  <Text style={styles.timelineTime}>{formatTimelineTime(event.timestamp)}</Text>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot} />
                    {index < Math.min(timeline.length, 8) - 1 ? (
                      <View style={styles.timelineLine} />
                    ) : null}
                  </View>
                  <Text style={styles.timelineEmoji}>{event.emoji}</Text>
                  <View style={styles.timelineCopy}>
                    <Text style={styles.timelineTitle}>{event.title}</Text>
                    {event.detail ? (
                      <Text style={styles.timelineDetail}>{event.detail}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.finishButton, pressed && styles.finishButtonPressed]}
          onPress={() => setFinishOpen(true)}
          accessibilityRole="button"
        >
          <Text style={styles.finishButtonText}>TERMINAR SALIDA</Text>
        </Pressable>
      </ScrollView>

      <VenuePickerSheet
        visible={venuePickerOpen}
        onClose={() => setVenuePickerOpen(false)}
        onVenueChanged={(venue) => setNotice(`Ahora consta: ${venue.name}.`)}
      />

      <Modal
        transparent
        visible={beerPickerOpen}
        animationType="slide"
        onRequestClose={() => setBeerPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setBeerPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetEyebrow}>🍺 CERVEZA</Text>
            <Text style={styles.sheetTitle}>¿Qué ha caído?</Text>
            <Text style={styles.sheetText}>Solo necesitamos el formato. Nada de cálculos inventados.</Text>

            <View style={styles.beerOptions}>
              {BEER_OPTIONS.map((option) => (
                <Pressable
                  key={option.size}
                  style={({ pressed }) => [
                    styles.beerOption,
                    pressed && styles.beerOptionPressed,
                  ]}
                  onPress={() => addBeer(option.size, option.label)}
                >
                  <View>
                    <Text style={styles.beerOptionText}>{option.label}</Text>
                    <Text style={styles.beerOptionHint}>{option.hint}</Text>
                  </View>
                  <Ionicons name="add-circle" color={colors.accent} size={24} />
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={finishOpen}
        animationType="fade"
        onRequestClose={() => setFinishOpen(false)}
      >
        <View style={styles.finishBackdrop}>
          <View style={styles.finishCard}>
            <Text style={styles.finishEyebrow}>FIN DE LA NOCHE</Text>
            <Text style={styles.finishTitle}>¿Damos esto por terminado?</Text>
            <Text style={styles.finishSummary}>
              {formatElapsed(elapsed)} · {formatDistance(activeOuting.distanceMeters)} · {drinks.length} bebida
              {drinks.length === 1 ? '' : 's'} registrada{drinks.length === 1 ? '' : 's'} · {stops.length} garito
              {stops.length === 1 ? '' : 's'}
            </Text>

            <Pressable
              style={styles.confirmFinish}
              onPress={handleFinish}
              accessibilityRole="button"
            >
              <Text style={styles.confirmFinishText}>TERMINAR Y VER RESUMEN</Text>
            </Pressable>

            <Pressable
              style={styles.continueButton}
              onPress={() => setFinishOpen(false)}
              accessibilityRole="button"
            >
              <Text style={styles.continueButtonText}>Seguir con la noche</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type DrinkButtonProps = {
  emoji: string;
  label: string;
  count: number;
  onPress: () => void;
};

function DrinkButton({ emoji, label, count, onPress }: DrinkButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.drinkButton, pressed && styles.drinkButtonPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Añadir ${label.toLowerCase()}`}
    >
      <Text style={styles.drinkEmoji}>{emoji}</Text>
      <Text style={styles.drinkLabel}>{label}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 112, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  liveText: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  timer: { marginTop: 4, color: colors.text, fontSize: 36, fontWeight: '900', fontVariant: ['tabular-nums'] },
  venueBadge: {
    maxWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  venueBadgePressed: { borderColor: colors.accent },
  venueText: { flexShrink: 1, color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  venueTextActive: { color: colors.text },
  routeSection: { gap: 10 },
  routeHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  routeEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.35 },
  routeDistance: { marginTop: 2, color: colors.text, fontSize: 25, fontWeight: '900' },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gpsBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  routeMeta: { minHeight: 22, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  routeMetaText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  venueAction: {
    minHeight: 78,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  venueActionPressed: { borderColor: colors.accent },
  venueActionIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
  },
  venueActionCopy: { flex: 1 },
  venueActionEyebrow: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  venueActionTitle: { marginTop: 2, color: colors.text, fontSize: 14, fontWeight: '900' },
  venueActionText: { marginTop: 2, color: colors.textMuted, fontSize: 10, lineHeight: 14 },
  venueActionButton: { color: colors.accent, fontSize: 9, fontWeight: '900' },
  gpsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gpsWarningCopy: { flex: 1 },
  gpsWarningTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  gpsWarningText: { marginTop: 3, color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  retryButton: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surface },
  retryButtonPressed: { backgroundColor: colors.background },
  retryButtonText: { color: colors.accent, fontSize: 9, fontWeight: '900' },
  noticeBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
  },
  noticeText: { flex: 1, color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  undoText: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  drinkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  drinkButton: {
    width: '48%',
    minHeight: 116,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  drinkButtonPressed: { backgroundColor: colors.surfaceRaised, transform: [{ scale: 0.985 }] },
  drinkEmoji: { fontSize: 30 },
  drinkLabel: { marginTop: 8, color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },
  countBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 27,
    height: 27,
    paddingHorizontal: 7,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  countText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  timelineCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  sectionTitle: { marginTop: 3, color: colors.text, fontSize: 20, fontWeight: '900' },
  eventCount: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  timelineList: { marginTop: 18, gap: 0 },
  timelineRow: { minHeight: 54, flexDirection: 'row', alignItems: 'flex-start' },
  timelineTime: { width: 46, paddingTop: 2, color: colors.textMuted, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
  timelineRail: { width: 16, alignItems: 'center', alignSelf: 'stretch' },
  timelineDot: { width: 8, height: 8, marginTop: 4, borderRadius: 4, backgroundColor: colors.accent },
  timelineLine: { width: 1, flex: 1, marginTop: 3, backgroundColor: colors.border },
  timelineEmoji: { width: 30, marginLeft: 5, fontSize: 18 },
  timelineCopy: { flex: 1, paddingBottom: 12 },
  timelineTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  timelineDetail: { marginTop: 2, color: colors.textMuted, fontSize: 11 },
  finishButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  finishButtonPressed: { backgroundColor: colors.surface },
  finishButtonText: { color: colors.accent, fontSize: 13, fontWeight: '900', letterSpacing: 0.7 },
  emptyState: { flex: 1, paddingHorizontal: 26, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  emptyEyebrow: { marginTop: 22, color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  emptyTitle: { marginTop: 8, color: colors.text, fontSize: 27, textAlign: 'center', fontWeight: '900' },
  emptyText: { marginTop: 10, maxWidth: 360, color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  startButton: {
    minHeight: 56,
    marginTop: 24,
    paddingHorizontal: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  startButtonText: { color: colors.text, fontSize: 14, fontWeight: '900', letterSpacing: 0.6 },
  primaryPressed: { backgroundColor: colors.accentPressed },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: { width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: colors.border },
  sheetEyebrow: { marginTop: 22, color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  sheetTitle: { marginTop: 5, color: colors.text, fontSize: 26, fontWeight: '900' },
  sheetText: { marginTop: 7, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  beerOptions: { marginTop: 18, gap: 10 },
  beerOption: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  beerOptionPressed: { borderColor: colors.accent },
  beerOptionText: { color: colors.text, fontSize: 16, fontWeight: '900' },
  beerOptionHint: { marginTop: 2, color: colors.textMuted, fontSize: 11 },
  finishBackdrop: {
    flex: 1,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.74)',
  },
  finishCard: {
    width: '100%',
    maxWidth: 440,
    padding: 22,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  finishEyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  finishTitle: { marginTop: 7, color: colors.text, fontSize: 25, lineHeight: 30, fontWeight: '900' },
  finishSummary: { marginTop: 10, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  confirmFinish: {
    minHeight: 54,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.accent,
  },
  confirmFinishText: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  continueButton: { minHeight: 48, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
});
