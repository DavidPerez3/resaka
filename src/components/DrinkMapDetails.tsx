import { StyleSheet, Text, View } from 'react-native';

import {
  buildDrinkClusterBadge,
  formatDrinkMapTime,
  type DrinkMapCluster,
} from '@/domain/drinkMap';
import { colors } from '@/theme/colors';

type DrinkMapDetailsProps = {
  clusters: DrinkMapCluster[];
};

export function DrinkMapDetails({ clusters }: DrinkMapDetailsProps) {
  if (clusters.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>CONSUMICIONES EN RUTA</Text>
          <Text style={styles.title}>Dónde cayó cada una</Text>
        </View>
        <Text style={styles.count}>{clusters.reduce((total, cluster) => total + cluster.items.length, 0)}</Text>
      </View>

      <View style={styles.clusterList}>
        {clusters.map((cluster) => (
          <View key={cluster.id} style={styles.clusterCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{buildDrinkClusterBadge(cluster)}</Text>
            </View>

            <View style={styles.items}>
              {cluster.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.time}>{formatDrinkMapTime(item.timestamp)}</Text>
                  <View style={styles.itemCopy}>
                    <Text style={styles.drink}>{item.label}</Text>
                    <Text style={styles.place}>{item.placeLabel}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.25,
  },
  title: {
    marginTop: 3,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  count: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  clusterList: { gap: 9 },
  clusterCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    minWidth: 46,
    minHeight: 46,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
  },
  badgeText: { color: colors.text, fontSize: 15, fontWeight: '900' },
  items: { flex: 1, gap: 8 },
  itemRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  time: {
    width: 42,
    paddingTop: 1,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  itemCopy: { flex: 1 },
  drink: { color: colors.text, fontSize: 12, fontWeight: '900' },
  place: { marginTop: 1, color: colors.textMuted, fontSize: 11, fontWeight: '600' },
});
