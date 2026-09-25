import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { NativeShareCard } from '@/components/NativeShareCard';
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
  const nativeCardRef = useRef<View>(null);
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
    setPhotoBusy(true);
    setMessage(null);
    setError(null);
    try {
      const photo = Platform.OS === 'web'
        ? await pickShareBackgroundPhotoWeb()
        : await pickShareBackgroundPhotoNative();
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

      if (!nativeCardRef.current) throw new Error('La tarjeta todavía no está preparada.');
      if (!(await Sharing.isAvailableAsync())) throw new Error('Este dispositivo no permite compartir archivos.');

      const uri = await captureRef(nativeCardRef, {
        format: 'png',
        quality: 1,
        width: 1080,
        height: 1920,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Compartir salida de RESAKA',
        UTI: 'public.png',
      });
      setMessage('Tarjeta compartida.');
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
            ) : <NativeShareCard ref={nativeCardRef} completed={completed} options={options} />}
          </View>

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
                La foto se usa únicamente para crear la tarjeta en tu dispositivo y no se guarda en la salida.
              </Text>
          </>

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

async function pickShareBackgroundPhotoNative() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Necesitamos permiso para elegir una foto de la galería.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.88,
  });
  return result.canceled ? null : result.assets[0]?.uri ?? null;
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
