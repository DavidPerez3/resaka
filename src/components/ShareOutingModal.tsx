import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { CompletedOuting } from '@/features/outing/types';
import {
  buildSharePreviewUri,
  pickShareBackgroundPhotoWeb,
  type ShareCardOptions,
  shareOutingCardWeb,
} from '@/features/sharing/shareOuting';
import { colors } from '@/theme/colors';

type ShareOutingModalProps = {
  visible: boolean;
  completed: CompletedOuting;
  onClose: () => void;
};

type ShareVisibilityKey = 'showRoute' | 'showDrinks' | 'showVenues';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function ShareOutingModal({ visible, completed, onClose }: ShareOutingModalProps) {
  const [options, setOptions] = useState<ShareCardOptions>({
    showRoute: true,
    showDrinks: true,
    showVenues: true,
    backgroundPhotoDataUrl: null,
  });
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUri = useMemo(() => buildSharePreviewUri(completed, options), [completed, options]);
  const hasPhoto = Boolean(options.backgroundPhotoDataUrl);

  const toggle = (key: ShareVisibilityKey) => {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
    setMessage(null);
    setError(null);
  };

  const handlePickPhoto = async () => {
    if (Platform.OS !== 'web') return;

    setPhotoBusy(true);
    setMessage(null);
    setError(null);
    try {
      const photo = await pickShareBackgroundPhotoWeb();
      if (photo) {
        setOptions((current) => ({ ...current, backgroundPhotoDataUrl: photo }));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar la foto.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = () => {
    setOptions((current) => ({ ...current, backgroundPhotoDataUrl: null }));
    setMessage(null);
    setError(null);
  };

  const handleShare = async () => {
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      if (Platform.OS === 'web') {
        const result = await shareOutingCardWeb(completed, options);
        setMessage(
          result === 'shared'
            ? 'Imagen enviada al menú de compartir.'
            : 'Tu navegador no permite compartir archivos directamente. Hemos descargado el PNG.',
        );
        return;
      }

      await Share.share({
        title: 'Mi salida en RESAKA',
        message: `Mi salida en RESAKA: ${completed.drinks.length} bebidas · ${completed.stops.length} garitos. Los datos que no recordabas.`,
      });
      setMessage('Compartido. La tarjeta PNG nativa se activará con la build de Android/iOS.');
    } catch (caught) {
      const text = caught instanceof Error ? caught.message : 'No se pudo compartir la salida.';
      if (!/abort|cancel/i.test(text)) setError(text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>COMPARTIR SALIDA</Text>
              <Text style={styles.title}>Que conste en redes.</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button">
              <Ionicons name="close" color={colors.text} size={23} />
            </Pressable>
          </View>

          <View style={styles.previewFrame}>
            {Platform.OS === 'web' ? (
              <Image source={{ uri: previewUri }} resizeMode="contain" style={styles.previewImage} />
            ) : (
              <View style={styles.nativePreview}>
                <Text style={styles.nativeBrand}>RESAKA</Text>
                <Text style={styles.nativeTagline}>Toda noche deja rastro.</Text>
                <Text style={styles.nativeMeta}>
                  {completed.drinks.length} bebidas · {completed.stops.length} garitos
                </Text>
              </View>
            )}
          </View>

          {Platform.OS === 'web' ? (
            <>
              <Text style={styles.optionsTitle}>FONDO</Text>
              <View style={styles.photoActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.photoButton,
                    hasPhoto && styles.photoButtonActive,
                    pressed && styles.togglePressed,
                  ]}
                  onPress={handlePickPhoto}
                  disabled={photoBusy}
                  accessibilityRole="button"
                >
                  {photoBusy ? (
                    <ActivityIndicator color={colors.accent} size="small" />
                  ) : (
                    <Ionicons name="images-outline" color={hasPhoto ? colors.accent : colors.text} size={19} />
                  )}
                  <Text style={[styles.photoButtonText, hasPhoto && styles.photoButtonTextActive]}>
                    {hasPhoto ? 'CAMBIAR FOTO' : 'ELEGIR FOTO'}
                  </Text>
                </Pressable>

                {hasPhoto ? (
                  <Pressable
                    style={({ pressed }) => [styles.removePhotoButton, pressed && styles.togglePressed]}
                    onPress={handleRemovePhoto}
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash-outline" color={colors.danger} size={18} />
                    <Text style={styles.removePhotoText}>QUITAR</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.photoHint}>
                La foto se procesa en tu navegador para crear la imagen y no se guarda en la salida.
              </Text>
            </>
          ) : null}

          <Text style={styles.optionsTitle}>QUÉ QUIERES ENSEÑAR</Text>
          <View style={styles.optionRow}>
            <ShareToggle
              icon="map-outline"
              label="Ruta"
              enabled={options.showRoute}
              onPress={() => toggle('showRoute')}
            />
            <ShareToggle
              icon="beer-outline"
              label="Bebidas"
              enabled={options.showDrinks}
              onPress={() => toggle('showDrinks')}
            />
            <ShareToggle
              icon="location-outline"
              label="Garitos"
              enabled={options.showVenues}
              onPress={() => toggle('showVenues')}
            />
          </View>

          <View style={styles.privacyNote}>
            <Ionicons name="eye-off-outline" color={colors.textMuted} size={17} />
            <Text style={styles.privacyText}>
              Lo que desactives desaparece completamente de la tarjeta; no se sustituye por ningún aviso.
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed, busy && styles.disabled]}
            onPress={handleShare}
            disabled={busy}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Ionicons name="share-social" color={colors.text} size={20} />
                <Text style={styles.shareButtonText}>COMPARTIR IMAGEN</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.formatHint}>Formato actual: Story 9:16 · PNG 1080 × 1920</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

type ShareToggleProps = {
  icon: IoniconName;
  label: string;
  enabled: boolean;
  onPress: () => void;
};

function ShareToggle({ icon, label, enabled, onPress }: ShareToggleProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggle,
        enabled && styles.toggleEnabled,
        pressed && styles.togglePressed,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
    >
      <Ionicons name={icon} color={enabled ? colors.accent : colors.textMuted} size={19} />
      <Text style={[styles.toggleText, enabled && styles.toggleTextEnabled]}>{label}</Text>
      <Ionicons
        name={enabled ? 'checkmark-circle' : 'ellipse-outline'}
        color={enabled ? colors.accent : colors.textMuted}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  sheet: {
    maxHeight: '96%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
    gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { marginTop: 3, color: colors.text, fontSize: 24, fontWeight: '900' },
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
  previewFrame: {
    alignSelf: 'center',
    width: 180,
    height: 320,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: { width: '100%', height: '100%' },
  nativePreview: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
    backgroundColor: colors.surfaceRaised,
  },
  nativeBrand: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: 2 },
  nativeTagline: { marginTop: 8, color: colors.accent, fontSize: 18, fontWeight: '900' },
  nativeMeta: { marginTop: 14, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  optionsTitle: { color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  photoActions: { flexDirection: 'row', gap: 8 },
  photoButton: {
    minHeight: 50,
    flex: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoButtonActive: { borderColor: colors.accent },
  photoButtonText: { color: colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  photoButtonTextActive: { color: colors.accent },
  removePhotoButton: {
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removePhotoText: { color: colors.danger, fontSize: 10, fontWeight: '900' },
  photoHint: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  optionRow: { flexDirection: 'row', gap: 8 },
  toggle: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleEnabled: { borderColor: colors.accent },
  togglePressed: { opacity: 0.78 },
  toggleText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  toggleTextEnabled: { color: colors.text },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 3,
  },
  privacyText: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  shareButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  shareButtonPressed: { backgroundColor: colors.accentPressed },
  shareButtonText: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.7 },
  disabled: { opacity: 0.55 },
  error: { color: colors.danger, fontSize: 11, fontWeight: '700' },
  success: { color: colors.success, fontSize: 11, fontWeight: '700' },
  formatHint: { color: colors.textMuted, fontSize: 10, textAlign: 'center' },
});
