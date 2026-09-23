import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, useTheme } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Rendered on the right of the title row. */
  accessory?: ReactNode;
  children: ReactNode;
}

/** Bottom sheet over a dimmed backdrop, as in the "Choose category" design. */
export function Sheet({ visible, onClose, title, accessory, children }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: t.card, paddingBottom: 32 + insets.bottom }]} accessibilityViewIsModal>
        <View style={[styles.handle, { backgroundColor: t.border }]} />
        {title ? (
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: t.text }]}>{title}</Text>
            {accessory}
          </View>
        ) : null}
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 30, 29, 0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    gap: 22,
  },
  handle: { alignSelf: 'center', width: 48, height: 5, borderRadius: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.semibold, fontSize: 18 },
});
