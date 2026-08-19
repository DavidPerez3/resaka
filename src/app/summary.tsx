import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildOutingTimeline, formatTimelineTime } from '@/domain/timeline';
import { useOutingSession } from '@/features/outing/OutingSessionContext';
import { colors } from '@/theme/colors';

function formatDuration(startedAt: string, endedAt?: string) {
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const seconds = Math.max(0, Math.floor((end - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = seconds % 60;
  return hours > 0
    ? `${hours} h ${String(minutes).padStart(2, '0')} min`
    : `${minutes} min ${String(restSeconds).padStart(2, '0')} s`;
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(timestamp));
}

export default function SummaryScreen() {
  const { lastFinishedOuting, clearLastFinishedOuting, startOuting } = useOutingSession();

  const timeline = useMemo(
    () =>
      lastFinishedOuting
        ? buildOutingTimeline(lastFinishedOuting.outing, lastFinishedOuting.drinks)
        : [],
    [lastFinishedOuting],
  );

  const stats = useMemo(() => {
    const drinks = lastFinishedOuting?.drinks ?? [];
    return {
      total: drinks.length,
      beer: drinks.filter((drink) => drink.type === 'BEER').length,
      kalimotxo: drinks.filter((drink) => drink.type === 'KALIMOTXO').length,
      shot: drinks.filter((drink) => drink.type === 'SHOT').length,
      mixed: drinks.filter((drink) => drink.type === 'MIXED_DRINK').length,
      quinto: drinks.filter((drink) => drink.type === 'BEER' && drink.beerSize === 'QUINTO').length,
      tercio: drinks.filter((drink) => drink.type === 'BEER' && drink.beerSize === 'TERCIO').length,
      litrona: drinks.filter((drink) => drink.type === 'BEER' && drink.beerSize === 'LITRONA').length,
    };
  }, [lastFinishedOuting]);

  if (!lastFinishedOuting) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" color={colors.textMuted} size={40} />
          <Text style={styles.emptyTitle}>No hay resumen que enseñar.</Text>
          <Text style={styles.emptyText}>Termina una salida y aparecerá aquí todo lo que consta en acta.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/')} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>VOLVER AL INICIO</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { outing } = lastFinishedOuting;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.replace('/')} accessibilityRole="button">
            <Ionicons name="close" color={colors.text} size={23} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>SALIDA TERMINADA</Text>
            <Text style={styles.title}>Esto es lo que pasó.</Text>
            <Text style={styles.date}>{formatDate(outing.startedAt)}</Text>
          </View>
        </View>

        <View style={styles.heroStats}>
          <Stat value={formatDuration(outing.startedAt, outing.endedAt)} label="Duración" wide />
          <Stat value={`${stats.total}`} label="Bebidas" />
          <Stat value="0.0 km" label="Distancia" muted />
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapIcon}>
            <Ionicons name="map-outline" color={colors.accent} size={30} />
          </View>
          <Text style={styles.mapTitle}>La ruta llega en el Bloque 3.</Text>
          <Text style={styles.mapText}>
            Ya tenemos la salida a salvo. Lo siguiente será registrar GPS, distancia y recorrido real.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionEyebrow}>INVENTARIO</Text>
            <Text style={styles.sectionTitle}>Bebidas</Text>
          </View>
          <View style={styles.drinkGrid}>
            <DrinkStat emoji="🍺" label="Cervezas" value={stats.beer} />
            <DrinkStat emoji="🍷" label="Kalimotxos" value={stats.kalimotxo} />
            <DrinkStat emoji="🥃" label="Chupitos" value={stats.shot} />
            <DrinkStat emoji="🍸" label="Copas" value={stats.mixed} />
          </View>

          {stats.beer > 0 ? (
            <View style={styles.beerBreakdown}>
              <Text style={styles.beerBreakdownTitle}>Desglose cervecero</Text>
              <View style={styles.beerBreakdownRows}>
                <BeerRow label="Quintos" value={stats.quinto} />
                <BeerRow label="Tercios" value={stats.tercio} />
                <BeerRow label="Litronas" value={stats.litrona} />
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionEyebrow}>RECONSTRUCCIÓN DE LOS HECHOS</Text>
            <Text style={styles.sectionTitle}>Timeline</Text>
          </View>
          <View style={styles.timelineCard}>
            {timeline.map((event, index) => (
              <View key={event.id} style={styles.timelineRow}>
                <Text style={styles.timelineTime}>{formatTimelineTime(event.timestamp)}</Text>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDot} />
                  {index < timeline.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <Text style={styles.timelineEmoji}>{event.emoji}</Text>
                <View style={styles.timelineCopy}>
                  <Text style={styles.timelineTitle}>{event.title}</Text>
                  {event.detail ? <Text style={styles.timelineDetail}>{event.detail}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.savedCard}>
          <Ionicons name="shield-checkmark" color={colors.success} size={27} />
          <View style={styles.savedCopy}>
            <Text style={styles.savedTitle}>Guardado en este dispositivo</Text>
            <Text style={styles.savedText}>
              Puedes cerrar o recargar RESAKA: este resumen seguirá aquí. La sincronización entre dispositivos llegará con tu cuenta.
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={() => router.replace('/')}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>VOLVER AL INICIO</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            clearLastFinishedOuting();
            startOuting();
            router.replace('/outing');
          }}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>EMPEZAR OTRA SALIDA</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type StatProps = { value: string; label: string; wide?: boolean; muted?: boolean };

function Stat({ value, label, wide = false, muted = false }: StatProps) {
  return (
    <View style={[styles.stat, wide && styles.statWide]}>
      <Text style={[styles.statValue, muted && styles.statValueMuted]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DrinkStat({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <View style={styles.drinkStat}>
      <Text style={styles.drinkEmoji}>{emoji}</Text>
      <Text style={styles.drinkValue}>{value}</Text>
      <Text style={styles.drinkLabel}>{label}</Text>
    </View>
  );
}

function BeerRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.beerRow}>
      <Text style={styles.beerRowLabel}>{label}</Text>
      <Text style={styles.beerRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 42, gap: 22 },
  header: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { marginTop: 5, color: colors.text, fontSize: 30, lineHeight: 35, fontWeight: '900' },
  date: { marginTop: 5, color: colors.textMuted, fontSize: 13, textTransform: 'capitalize' },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    minWidth: 100,
    flex: 1,
    padding: 15,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statWide: { minWidth: 160 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  statValueMuted: { color: colors.textMuted },
  statLabel: { marginTop: 3, color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  mapCard: {
    minHeight: 165,
    padding: 19,
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  mapTitle: { marginTop: 12, color: colors.text, fontSize: 18, fontWeight: '900' },
  mapText: { marginTop: 5, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  section: { gap: 13 },
  sectionHeading: { gap: 3 },
  sectionEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.35 },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  drinkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  drinkStat: {
    width: '48.5%',
    flexGrow: 1,
    minHeight: 116,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  drinkEmoji: { fontSize: 26 },
  drinkValue: { marginTop: 5, color: colors.text, fontSize: 25, fontWeight: '900' },
  drinkLabel: { marginTop: 1, color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  beerBreakdown: {
    padding: 16,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  beerBreakdownTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  beerBreakdownRows: { marginTop: 10, gap: 8 },
  beerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  beerRowLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  beerRowValue: { color: colors.text, fontSize: 14, fontWeight: '900' },
  timelineCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timelineRow: { minHeight: 51, flexDirection: 'row', alignItems: 'flex-start' },
  timelineTime: { width: 45, paddingTop: 3, color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  timelineRail: { width: 18, minHeight: 51, alignItems: 'center' },
  timelineDot: { width: 8, height: 8, marginTop: 5, borderRadius: 4, backgroundColor: colors.accent },
  timelineLine: { width: 1, flex: 1, marginTop: 3, backgroundColor: colors.border },
  timelineEmoji: { width: 31, fontSize: 18, lineHeight: 23 },
  timelineCopy: { flex: 1, paddingTop: 1 },
  timelineTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  timelineDetail: { marginTop: 2, color: colors.textMuted, fontSize: 11 },
  savedCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 17,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  savedCopy: { flex: 1 },
  savedTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  savedText: { marginTop: 3, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  primaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  primaryButtonPressed: { backgroundColor: colors.accentPressed },
  primaryButtonText: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },
  secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  emptyState: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 16, color: colors.text, fontSize: 25, fontWeight: '900', textAlign: 'center' },
  emptyText: { maxWidth: 340, marginTop: 8, color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
