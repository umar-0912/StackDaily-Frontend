import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  Image,
  BackHandler,
  Platform,
} from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import OnboardingPage from '../../src/components/OnboardingPage';
import { markOnboardingSeen } from '../../src/utils/onboarding';

const { width } = Dimensions.get('window');
const TOTAL_PAGES = 4;

// ─── Animated Welcome Page ───────────────────────────────────────────────────

function WelcomePage({ isActive }: { isActive: boolean }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const tagline1 = useRef(new Animated.Value(0)).current;
  const tagline2 = useRef(new Animated.Value(0)).current;
  const tagline3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.stagger(200, [
        Animated.timing(tagline1, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(tagline2, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(tagline3, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [isActive]);

  return (
    <OnboardingPage>
      <View style={styles.centerContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
          />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text variant="headlineLarge" style={styles.brandTitle}>
            StackDaily
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text variant="headlineSmall" style={styles.heroHeading}>
            Learn Something New{'\n'}Every Single Day
          </Text>
        </Animated.View>

        <View style={styles.taglineContainer}>
          {[
            { anim: tagline1, text: 'Daily lessons.' },
            { anim: tagline2, text: 'Learn, then prove it.' },
            { anim: tagline3, text: 'Built for learners.' },
          ].map(({ anim, text }) => (
            <Animated.View key={text} style={[styles.taglineRow, { opacity: anim }]}>
              <MaterialCommunityIcons name="star-four-points" size={14} color="#6200EE" />
              <Text variant="bodyLarge" style={styles.taglineText}>{text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </OnboardingPage>
  );
}

// ─── Features Page ───────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: 'book-open-page-variant' as const,
    color: '#6200EE',
    title: 'Learn Daily',
    body: 'Pick your topics. Get a new lesson delivered every day.',
  },
  {
    icon: 'lightbulb-on' as const,
    color: '#03DAC6',
    title: 'Understand First',
    body: 'Each lesson teaches you the concept with clear explanations before testing you.',
  },
  {
    icon: 'fire' as const,
    color: '#FF9800',
    title: 'Quiz & Streak',
    body: 'Prove your understanding with MCQs. Build a daily learning streak.',
  },
];

function FeaturesPage({ isActive }: { isActive: boolean }) {
  const cardAnims = useRef(FEATURES.map(() => new Animated.Value(60))).current;
  const cardOpacities = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isActive) {
      Animated.stagger(150, FEATURES.map((_, i) =>
        Animated.parallel([
          Animated.timing(cardAnims[i], { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(cardOpacities[i], { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      )).start();
    }
  }, [isActive]);

  return (
    <OnboardingPage>
      <View style={styles.centerContent}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          How It Works
        </Text>

        <View style={styles.featureCardsContainer}>
          {FEATURES.map((feature, i) => (
            <Animated.View
              key={feature.title}
              style={{ opacity: cardOpacities[i], transform: [{ translateX: cardAnims[i] }] }}
            >
              <Surface style={styles.featureCard} elevation={2}>
                <View style={[styles.featureIconWrap, { backgroundColor: `${feature.color}18` }]}>
                  <MaterialCommunityIcons name={feature.icon} size={28} color={feature.color} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text variant="titleMedium" style={styles.featureTitle}>{feature.title}</Text>
                  <Text variant="bodyMedium" style={styles.featureBody}>{feature.body}</Text>
                </View>
              </Surface>
            </Animated.View>
          ))}
        </View>
      </View>
    </OnboardingPage>
  );
}

// ─── Notifications Page ──────────────────────────────────────────────────────

function NotificationsPage({
  isActive,
  onNext,
}: {
  isActive: boolean;
  onNext: () => void;
}) {
  const bellRotation = useRef(new Animated.Value(0)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already granted
  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      if (status === 'granted') setNotifEnabled(true);
      setChecking(false);
    });
  }, []);

  // Bell rocking animation
  useEffect(() => {
    if (isActive) {
      const rock = Animated.loop(
        Animated.sequence([
          Animated.timing(bellRotation, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(bellRotation, { toValue: -1, duration: 200, useNativeDriver: true }),
          Animated.timing(bellRotation, { toValue: 0.5, duration: 150, useNativeDriver: true }),
          Animated.timing(bellRotation, { toValue: -0.5, duration: 150, useNativeDriver: true }),
          Animated.timing(bellRotation, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.delay(2000),
        ]),
      );
      rock.start();

      Animated.stagger(200, [
        Animated.timing(card1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(card2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      return () => rock.stop();
    }
  }, [isActive]);

  const bellRotateInterpolate = bellRotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const handleEnable = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      setNotifEnabled(true);
    }
    // Advance regardless of choice
    setTimeout(onNext, 300);
  };

  return (
    <OnboardingPage>
      <View style={styles.centerContent}>
        <Animated.View style={[styles.bellWrap, { transform: [{ rotate: bellRotateInterpolate }] }]}>
          <MaterialCommunityIcons
            name={notifEnabled ? 'bell-check' : 'bell-ring'}
            size={72}
            color={notifEnabled ? '#4CAF50' : '#6200EE'}
          />
        </Animated.View>

        <Text variant="titleLarge" style={styles.notifHeading}>
          {notifEnabled ? 'Notifications Enabled!' : 'Never Miss a Lesson'}
        </Text>

        <View style={styles.notifCardsContainer}>
          <Animated.View style={{ opacity: card1Opacity }}>
            <View style={[styles.notifCard, { borderLeftColor: '#03DAC6' }]}>
              <MaterialCommunityIcons name="clock-outline" size={22} color="#03DAC6" />
              <View style={styles.notifCardText}>
                <Text variant="titleSmall" style={styles.notifCardTitle}>Daily Reminder</Text>
                <Text variant="bodyMedium" style={styles.notifCardBody}>
                  One notification at 8 PM.{'\n'}That's it. No spam. Ever.
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: card2Opacity }}>
            <View style={[styles.notifCard, { borderLeftColor: '#FF9800' }]}>
              <MaterialCommunityIcons name="fire" size={22} color="#FF9800" />
              <View style={styles.notifCardText}>
                <Text variant="titleSmall" style={styles.notifCardTitle}>Protect Your Streak</Text>
                <Text variant="bodyMedium" style={styles.notifCardBody}>
                  A gentle nudge so you never{'\n'}break your learning streak.
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {!checking && !notifEnabled && (
          <View style={styles.notifActions}>
            <Button
              mode="contained"
              onPress={handleEnable}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Enable Notifications
            </Button>
            <Button
              mode="text"
              onPress={onNext}
              textColor="#999"
            >
              Maybe Later
            </Button>
          </View>
        )}

        {notifEnabled && (
          <View style={styles.notifActions}>
            <View style={styles.enabledBadge}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.enabledText}>You're all set!</Text>
            </View>
          </View>
        )}
      </View>
    </OnboardingPage>
  );
}

// ─── Get Started Page ────────────────────────────────────────────────────────

const CHECKLIST = [
  '12+ topics to explore',
  'Concept-first learning',
  'Daily MCQ quizzes',
  '100% free to start',
];

function GetStartedPage({ isActive }: { isActive: boolean }) {
  const router = useRouter();
  const checkAnims = useRef(CHECKLIST.map(() => new Animated.Value(0))).current;
  const checkSlides = useRef(CHECKLIST.map(() => new Animated.Value(-20))).current;

  useEffect(() => {
    if (isActive) {
      Animated.stagger(100, CHECKLIST.map((_, i) =>
        Animated.parallel([
          Animated.timing(checkAnims[i], { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(checkSlides[i], { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
      )).start();
    }
  }, [isActive]);

  const handleCreateAccount = async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/signup');
  };

  const handleLogin = async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/login');
  };

  return (
    <OnboardingPage>
      <View style={styles.centerContent}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoSmall}
        />

        <Text variant="headlineMedium" style={styles.getStartedHeading}>
          You're All Set!
        </Text>

        <Text variant="bodyLarge" style={styles.getStartedSubtitle}>
          Join thousands of learners{'\n'}growing daily with StackDaily
        </Text>

        <View style={styles.checklistContainer}>
          {CHECKLIST.map((item, i) => (
            <Animated.View
              key={item}
              style={[
                styles.checklistRow,
                { opacity: checkAnims[i], transform: [{ translateX: checkSlides[i] }] },
              ]}
            >
              <MaterialCommunityIcons name="check-circle" size={22} color="#4CAF50" />
              <Text variant="bodyLarge" style={styles.checklistText}>{item}</Text>
            </Animated.View>
          ))}
        </View>

        <View style={styles.ctaContainer}>
          <Button
            mode="contained"
            onPress={handleCreateAccount}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Create Account
          </Button>
          <Button
            mode="outlined"
            onPress={handleLogin}
            style={styles.outlinedButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.outlinedButtonLabel}
          >
            I Already Have One
          </Button>
        </View>
      </View>
    </OnboardingPage>
  );
}

// ─── Page Dots ───────────────────────────────────────────────────────────────

function PageDots({ currentPage }: { currentPage: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === currentPage ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main Onboarding Screen ─────────────────────────────────────────────────

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const scrollToPage = useCallback((page: number) => {
    flatListRef.current?.scrollToIndex({ index: page, animated: true });
  }, []);

  const handleNext = useCallback(() => {
    if (currentPage < TOTAL_PAGES - 1) {
      scrollToPage(currentPage + 1);
    }
  }, [currentPage, scrollToPage]);

  // Android back button handler
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentPage > 0) {
        scrollToPage(currentPage - 1);
        return true;
      }
      return true; // Prevent exit on first page
    });

    return () => handler.remove();
  }, [currentPage, scrollToPage]);

  const onMomentumScrollEnd = useCallback((e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  }, []);

  const pages = [
    { key: 'welcome', component: (active: boolean) => <WelcomePage isActive={active} /> },
    { key: 'features', component: (active: boolean) => <FeaturesPage isActive={active} /> },
    { key: 'notifications', component: (active: boolean) => <NotificationsPage isActive={active} onNext={handleNext} /> },
    { key: 'getstarted', component: (active: boolean) => <GetStartedPage isActive={active} /> },
  ];

  return (
    <View style={styles.screen}>
      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(item) => item.key}
        renderItem={({ item, index }) => (
          <View style={{ width, flex: 1 }}>
            {item.component(currentPage === index)}
          </View>
        )}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Bottom controls — page dots + next/skip buttons */}
      <View style={styles.bottomControls}>
        <PageDots currentPage={currentPage} />

        {currentPage === 0 && (
          <View style={styles.bottomButtons}>
            <Button
              mode="contained"
              onPress={() => scrollToPage(TOTAL_PAGES - 1)}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Get Started
            </Button>
            <Text style={styles.swipeHint}>or swipe to explore</Text>
          </View>
        )}

        {currentPage === 1 && (
          <View style={styles.bottomButtons}>
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Next
            </Button>
          </View>
        )}

        {/* Pages 2 (notifications) and 3 (get started) handle their own CTAs */}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Welcome
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 16,
  },
  brandTitle: {
    fontWeight: '700',
    color: '#6200EE',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroHeading: {
    color: '#1C1B1F',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 28,
  },
  taglineContainer: {
    gap: 12,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taglineText: {
    color: '#555',
  },

  // Features
  sectionTitle: {
    fontWeight: '700',
    color: '#1C1B1F',
    textAlign: 'center',
    marginBottom: 28,
  },
  featureCardsContainer: {
    gap: 16,
    width: '100%',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#FFFFFF',
    gap: 14,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 4,
  },
  featureBody: {
    color: '#666',
    lineHeight: 20,
  },

  // Notifications
  bellWrap: {
    marginBottom: 20,
  },
  notifHeading: {
    fontWeight: '700',
    color: '#1C1B1F',
    textAlign: 'center',
    marginBottom: 24,
  },
  notifCardsContainer: {
    gap: 14,
    width: '100%',
    marginBottom: 28,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  notifCardText: {
    flex: 1,
  },
  notifCardTitle: {
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 4,
  },
  notifCardBody: {
    color: '#666',
    lineHeight: 20,
  },
  notifActions: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  enabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  enabledText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 16,
  },

  // Get Started
  logoSmall: {
    width: 90,
    height: 90,
    borderRadius: 22,
    marginBottom: 16,
  },
  getStartedHeading: {
    fontWeight: '700',
    color: '#6200EE',
    textAlign: 'center',
    marginBottom: 8,
  },
  getStartedSubtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  checklistContainer: {
    gap: 14,
    marginBottom: 32,
    alignSelf: 'flex-start',
    paddingLeft: 8,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checklistText: {
    color: '#333',
  },
  ctaContainer: {
    width: '100%',
    gap: 12,
  },

  // Bottom controls
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#FAFAFA',
  },
  bottomButtons: {
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 5,
  },
  dotActive: {
    width: 24,
    height: 8,
    backgroundColor: '#6200EE',
    borderRadius: 4,
  },
  dotInactive: {
    width: 8,
    height: 8,
    backgroundColor: '#E0E0E0',
  },
  swipeHint: {
    color: '#999',
    fontSize: 13,
  },

  // Shared buttons
  primaryButton: {
    borderRadius: 12,
    width: '100%',
  },
  outlinedButton: {
    borderRadius: 12,
    width: '100%',
    borderColor: '#6200EE',
  },
  buttonContent: {
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  outlinedButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200EE',
  },
});
