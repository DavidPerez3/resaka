import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { BeerSize, DrinkType } from '@/domain/drinks';
import { colors } from '@/theme/colors';

type LocalDrink = {
  id: string;
  type: DrinkType;
  label: string;
  beerSize?: BeerSize;
};

const BEER_OPTIONS: Array<{ size: BeerSize; label: string }> = [
  { size: 'QUINTO', label: 'Quinto' },
  { size: 'TERCIO', label: 'Tercio' },
  { size: 'LITRONA', label: 'Litrona' },
];

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function OutingScreen() {
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [drinks, setDrinks] = useState<LocalDrink[]>([]);
  const [beerPickerOpen, setBeerPickerOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [notice, setNotice] = useState('Salida iniciada. Que conste en acta.');

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const counts = useMemo(
    () => ({
      beer: drinks.filter((drink) => drink.type === 'BEER').length,
      kalimotxo: drinks.filter((drink) => drink.type === 'KALIMOTXO').length,
      shot: drinks.filter((drink) => drink.type === 'SHOT').length,
      mixed: drinks.filter((drink) => drink.type === 'MIXED_DRINK').length,
    }),
    [drinks],
  );

  const addDrink = (type: DrinkType, label: string, beerSize?: BeerSize) => {
    const drink: LocalDrink = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      label,
      beerSize,
    };
    setDrinks((current) => [...current, drink]);
    setNotice(`${label} añadido.`);
  };

  const addBeer = (size: BeerSize, label: string) => {
    addDrink('BEER', label, size);
    setBeerPickerOpen(false);
  };

  const undoLast = () => {
    if (drinks.length === 0) {
      setNotice('Todavía no hay nada que deshacer.');
      return;
    }
    const last = drinks[drinks.length - 1];
    setDrinks((current) => current.slice(0, -1));
    setNotice(`${last.label} eliminado.`);
  };

  const finishOuting = () => {
    setFinishOpen(false);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>SALIDA EN CURSO</Text>
            </View>
            <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
          </View>
          <View style={styles.venueBadge}>
            <Ionicons name="location-outline" color={colors.textMuted} size={16} />
            <Text style={styles.venueText}>Sin garito</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapPulse}>
            <Ionicons name="navigate" color={colors.accent} size={28} />
          </View>
          <Text style={styles.mapTitle}>El mapa empieza aquí.</Text>
          <Text style={styles.mapText}>En la siguiente fase conectaremos el GPS y dibujaremos tu ruta real.</Text>
          <View style={styles.mapStats}>
            <Text style={styles.mapStat}>0.0 km</Text>
            <Text style={styles.mapDivider}>·</Text>
            <Text style={styles.mapStat}>0 garitos</Text>
          </View>
        </View>

        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>{notice}</Text>
          <Pressable onPress={undoLast} hitSlop={10} accessibilityRole="button">
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
            onPress={() => addDrink('KALIMOTXO', 'Kalimotxo')}
          />
          <DrinkButton
            emoji="🥃"
            label="CHUPITO"
            count={counts.shot}
            onPress={() => addDrink('SHOT', 'Chupito')}
          />
          <DrinkButton
            emoji="🍸"
            label="COPA"
            count={counts.mixed}
            onPress={() => addDrink('MIXED_DRINK', 'Copa')}
          />
        </View>

        <Pressable style={styles.venueButton} disabled accessibilityRole="button">
          <Ionicons name="location" color={colors.textMuted} size={18} />
          <Text style={styles.venueButtonText}>CAMBIAR DE GARITO · PRÓXIMAMENTE</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.finishButton, pressed && styles.finishButtonPressed]}
          onPress={() => setFinishOpen(true)}
          accessibilityRole="button"
        >
          <Text style={styles.finishButtonText}>TERMINAR SALIDA</Text>
        </Pressable>
      </View>

      <Modal transparent visible={beerPickerOpen} animationType="slide" onRequestClose={() => setBeerPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setBeerPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetEyebrow}>🍺 CERVEZA</Text>
            <Text style={styles.sheetTitle}>¿Qué ha caído?</Text>
            <View style={styles.beerOptions}>
              {BEER_OPTIONS.map((option) => (
                <Pressable
                  key={option.size}
                  style={({ pressed }) => [styles.beerOption, pressed && styles.beerOptionPressed]}
                  onPress={() => addBeer(option.size, option.label)}
                >
                  <Text style={styles.beerOptionText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={finishOpen} animationType="fade" onRequestClose={() => setFinishOpen(false)}>
        <View style={styles.finishBackdrop}>
          <View style={styles.finishCard}>
            <Text style={styles.finishEyebrow}>FIN DE LA NOCHE</Text>
            <Text style={styles.finishTitle}>¿Damos esto por terminado?</Text>
            <Text style={styles.finishSummary}>
              {formatElapsed(elapsed)} · {drinks.length} bebida{drinks.length === 1 ? '' : 's'} registrada{drinks.length === 1 ? '' : 's'}
            </Text>
            <Pressable style={styles.confirmFinish} onPress={finishOuting} accessibilityRole="button">
              <Text style={styles.confirmFinishText}>TERMINAR SALIDA</Text>
            </Pressable>
            <Pressable style={styles.continueButton} onPress={() => setFinishOpen(false)} accessibilityRole="button">
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  liveText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  timer: {
    marginTop: 4,
    color: colors.text,
    fontSize: 36,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  venueBadge: {
    maxWidth: 132,
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
  venueText: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  mapCard: {
    minHeight: 160,
    padding: 18,
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mapPulse: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  mapTitle: {
    marginTop: 12,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  mapText: {
    marginTop: 5,
    maxWidth: 330,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  mapStats: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  mapStat: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  mapDivider: {
    color: colors.textMuted,
  },
  noticeBar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
  },
  noticeText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  undoText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
  },
  drinkGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  drinkButton: {
    width: '48.5%',
    minHeight: 104,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  drinkButtonPressed: {
    backgroundColor: colors.surfaceRaised,
    transform: [{ scale: 0.985 }],
  },
  drinkEmoji: {
    fontSize: 30,
  },
  drinkLabel: {
    marginTop: 8,
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  countBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 26,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  countText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  venueButton: {
    minHeight: 48,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.65,
  },
  venueButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  finishButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  finishButtonPressed: {
    backgroundColor: colors.surface,
  },
  finishButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
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
  sheetHandle: {
    width: 42,
    height: 5,
    alignSelf: 'center',
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  sheetEyebrow: {
    marginTop: 22,
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  sheetTitle: {
    marginTop: 5,
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  beerOptions: {
    marginTop: 20,
    gap: 10,
  },
  beerOption: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  beerOptionPressed: {
    backgroundColor: colors.accentPressed,
  },
  beerOptionText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  finishBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  finishCard: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  finishEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  finishTitle: {
    marginTop: 8,
    color: colors.text,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
  },
  finishSummary: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  confirmFinish: {
    minHeight: 54,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.accent,
  },
  confirmFinishText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  continueButton: {
    minHeight: 48,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});
