import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function SectionPlaceholder({ eyebrow, title, description, icon }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} color={colors.accent} size={32} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PRÓXIMAMENTE</Text>
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
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    marginTop: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginTop: 22,
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    maxWidth: 340,
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  badge: {
    marginTop: 22,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});
