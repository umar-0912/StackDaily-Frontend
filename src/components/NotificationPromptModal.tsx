import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Modal, Portal, Text, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  registerForPushNotifications,
  registerTokenWithBackend,
  markNotificationPromptSeen,
} from '../utils/notifications';

interface NotificationPromptModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function NotificationPromptModal({
  visible,
  onDismiss,
}: NotificationPromptModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleEnable = async () => {
    const token = await registerForPushNotifications();
    if (token) {
      await registerTokenWithBackend(token);
      // Only mark as seen when permission is actually granted
      await markNotificationPromptSeen();
    }
    onDismiss();
  };

  const handleNotNow = () => {
    // Don't mark as seen — prompt will reappear next app open
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleNotNow}
        contentContainerStyle={styles.modalWrapper}
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Surface style={styles.surface} elevation={4}>
            {/* Bell icon */}
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="bell-ring"
                size={36}
                color="#FFFFFF"
              />
            </View>

            {/* Heading */}
            <Text variant="titleLarge" style={styles.heading}>
              Stay on Track
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Get a gentle reminder at 8 PM to complete your daily lesson.
            </Text>

            {/* Benefit cards */}
            <View style={styles.benefitsContainer}>
              <View style={[styles.benefitCard, styles.benefitTeal]}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={22}
                  color="#03DAC6"
                />
                <Text variant="bodyMedium" style={styles.benefitText}>
                  One notification a day. No spam.
                </Text>
              </View>

              <View style={[styles.benefitCard, styles.benefitOrange]}>
                <MaterialCommunityIcons
                  name="fire"
                  size={22}
                  color="#FF9800"
                />
                <Text variant="bodyMedium" style={styles.benefitText}>
                  Protect your learning streak.
                </Text>
              </View>
            </View>

            {/* CTAs */}
            <Button
              mode="contained"
              onPress={handleEnable}
              style={styles.enableButton}
              labelStyle={styles.enableButtonLabel}
              contentStyle={styles.enableButtonContent}
            >
              Enable Notifications
            </Button>

            <Button
              mode="text"
              onPress={handleNotNow}
              textColor="#999"
              labelStyle={styles.notNowLabel}
            >
              Not Now
            </Button>
          </Surface>
        </Animated.View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  animatedContainer: {
    width: '100%',
    maxWidth: 340,
  },
  surface: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontWeight: '700',
    color: '#1C1B1F',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitsContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderLeftWidth: 4,
  },
  benefitTeal: {
    borderLeftColor: '#03DAC6',
  },
  benefitOrange: {
    borderLeftColor: '#FF9800',
  },
  benefitText: {
    flex: 1,
    color: '#333',
  },
  enableButton: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#6200EE',
    marginBottom: 4,
  },
  enableButtonContent: {
    height: 48,
  },
  enableButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  notNowLabel: {
    fontSize: 14,
  },
});
