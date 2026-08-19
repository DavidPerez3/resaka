import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BRAND } from '@/config/branding';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{BRAND.name}</Text>
            <Text style={styles.tagline}>{BRAND.tagline}</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person" color={colors.textMuted} size={22} />
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="moon" color={colors.accent} size={28} />
          </View>
          <Text style={styles.heroEyebrow}>TU PRÓXIMA NOCHE</Text>
          <Text style={styles.heroTitle}>Demasiada tranquilidad por aquí.</Text>
          <Text style={styles.heroText}>
            Empieza una salida y RESAKA irá guardando lo que luego nadie recuerda.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            accessibilityRole="button"
            onPress={() => router.push('/outing')}
          >
            <Ionicons name="play" color={colors.text} size={18} />
            <Text style={styles.primaryButtonText}>EMPEZAR SALIDA</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimas salidas</Text>
            <Text style={styles.sectionMeta}>0 registradas</Text>
          </View>
          <View style={styles.emptyCard}>
            <Ionicons name="footsteps-outline" color={colors.textMuted} size={24} />
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>Todavía no hay pruebas del delito.</Text>
              <Text style={styles.emptyText}>Cuando termines una salida aparecerá aquí.</Text>
            </View>
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  tagline: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 13,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroCard: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    marginBottom: 22,
  },
  heroEyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  heroTitle: {
    marginTop: 8,
    color: colors.text,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
  },
  heroText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 58,
    marginTop: 24,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  primaryButtonPressed: {
    backgroundColor: colors.accentPressed,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '850',
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCopy: {
    flex: 1,
    gap: 4,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
