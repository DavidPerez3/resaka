import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BRAND } from '@/config/branding';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.brand}>{BRAND.name}</Text>
          <Text style={styles.tagline}>{BRAND.tagline}</Text>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Demasiada tranquilidad por aquí.</Text>
          <Text style={styles.emptyText}>Tu próxima salida empezará desde aquí.</Text>
        </View>

        <Pressable style={styles.primaryButton} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>EMPEZAR SALIDA</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  hero: {
    marginTop: 32,
  },
  brand: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 3,
  },
  tagline: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 17,
  },
  emptyState: {
    gap: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
