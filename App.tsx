import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  AccessibilityInfo,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// ============================================================================
// VISUAL DESIGN PALETTE — WELCOME SCREEN & CORE THEME
// Derived directly from the provided reference specifications
// ============================================================================
const THEME = {
  cream: '#F5F3E8',
  black: '#080808',
  ink: '#171512',
  gold: '#A99A7D',
  goldLight: '#D0C4AB',
  footer: '#777267',
  white: '#FFFFFF',
  warmGreyBeige: '#E8E4D9',
} as const;

// Source of truth: style2.css --gold-gradient / .phone
// linear-gradient(135deg, #F5F3E8 0%, #E4D8BF 55%, #C8B58B 100%)
const GOLD_BG_COLORS = ['#F5F3E8', '#E4D8BF', '#C8B58B'] as const;
const GOLD_BG_LOCATIONS = [0, 0.55, 1] as const;

const SETUP_SCROLLBAR = {
  width: 4,
  right: 5,
  inset: 12,
  minThumb: 32,
  trackColor: 'rgba(120, 107, 86, 0.18)',
  thumbColors: ['#E4D8BF', '#C8B58B', '#A8926A'] as const,
} as const;

/**
 * CSS 135deg is 45° down-right in pixel space, not corner-to-corner.
 * Corner-to-corner on a tall phone is nearly vertical and looks flat.
 */
function css135GradientPoints(width: number, height: number): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  if (width <= 0 || height <= 0) {
    return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
  }
  if (width >= height) {
    return { start: { x: 0, y: 0 }, end: { x: height / width, y: 1 } };
  }
  return { start: { x: 0, y: 0 }, end: { x: 1, y: width / height } };
}

function GoldBackgroundGradient({
  style,
  children,
  pointerEvents,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  pointerEvents?: 'none' | 'auto' | 'box-none' | 'box-only';
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [layout, setLayout] = useState({
    width: windowWidth,
    height: windowHeight,
  });
  const { start, end } = css135GradientPoints(layout.width, layout.height);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width === layout.width && height === layout.height) {
      return;
    }
    setLayout({ width, height });
  };

  return (
    <LinearGradient
      colors={GOLD_BG_COLORS}
      locations={GOLD_BG_LOCATIONS}
      start={start}
      end={end}
      dither
      pointerEvents={pointerEvents}
      style={style}
      onLayout={handleLayout}
    >
      {children}
    </LinearGradient>
  );
}

function SetupScrollArea({ children }: { children: React.ReactNode }) {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const overflow = Math.max(contentHeight - viewportHeight, 0);
  const showScrollbar = overflow > 1 && viewportHeight > 0;
  const trackHeight = Math.max(viewportHeight - SETUP_SCROLLBAR.inset * 2, 0);
  const thumbHeight = showScrollbar
    ? Math.min(
        trackHeight,
        Math.max(
          SETUP_SCROLLBAR.minThumb,
          (viewportHeight / contentHeight) * trackHeight
        )
      )
    : 0;
  const maxThumbTravel = Math.max(trackHeight - thumbHeight, 0);
  const clampedOffset = Math.min(Math.max(scrollOffset, 0), overflow);
  const thumbOffset =
    overflow > 0 ? (clampedOffset / overflow) * maxThumbTravel : 0;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollOffset(event.nativeEvent.contentOffset.y);
  };

  return (
    <View
      style={styles.setupScrollArea}
      onLayout={(event) => {
        setViewportHeight(event.nativeEvent.layout.height);
      }}
    >
      <ScrollView
        style={styles.setupScrollView}
        contentContainerStyle={styles.setupScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={(_width, height) => setContentHeight(height)}
      >
        {children}
      </ScrollView>
      {showScrollbar ? (
        <View pointerEvents="none" style={styles.setupScrollbarTrack}>
          <LinearGradient
            colors={SETUP_SCROLLBAR.thumbColors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              styles.setupScrollbarThumb,
              {
                height: thumbHeight,
                transform: [{ translateY: thumbOffset }],
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

// Screen identifiers for active navigation
// Strictly limited to required screens: obsolete flows completely removed
type Screen = 'title' | 'character-setup' | 'city-picker' | 'no-save-found';

// ============================================================================
// CURATED LOCAL INDIAN DATA POOLS
// ============================================================================
const INDIAN_MALE_FIRST_NAMES: readonly string[] = [
  'Aarav',
  'Vihaan',
  'Arjun',
  'Aditya',
  'Sai',
  'Kabir',
  'Rohan',
  'Dev',
  'Vikram',
  'Ishaan',
  'Siddharth',
  'Rahul',
  'Aryan',
  'Reyansh',
  'Pranav',
  'Aayush',
  'Neil',
  'Karan',
  'Tanmay',
  'Vivaan',
  'Dhruv',
  'Samar',
  'Nikhil',
  'Karthik',
  'Aniruddh',
];

const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Kochi',
] as const;

export type IndianCity = (typeof INDIAN_CITIES)[number];

/**
 * Generates a random Indian first name from the pool.
 * Avoids returning the currently active name if alternatives exist.
 */
function getRandomFirstName(currentName: string = ''): string {
  const normalizedCurrent = currentName.trim().toLowerCase();
  const candidates = INDIAN_MALE_FIRST_NAMES.filter(
    (name) => name.toLowerCase() !== normalizedCurrent
  );
  const activePool =
    candidates.length > 0 ? candidates : INDIAN_MALE_FIRST_NAMES;
  const randomIndex = Math.floor(Math.random() * activePool.length);
  return activePool[randomIndex];
}

// ============================================================================
// REUSABLE STANDARD BUTTON (Used on inner informational / picker screens)
// ============================================================================
interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityLabel?: string;
  height?: number;
}

function AppButton({
  title,
  onPress,
  variant = 'primary',
  accessibilityLabel,
  height,
}: AppButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={[
        styles.standardButtonBase,
        isPrimary
          ? styles.standardButtonPrimary
          : styles.standardButtonSecondary,
        height ? { height } : null,
      ]}
    >
      <Text
        style={[
          styles.standardButtonTextBase,
          isPrimary
            ? styles.standardButtonTextPrimary
            : styles.standardButtonTextSecondary,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// CHARACTER SETUP CARD BUTTON (Faithful reproduction of .legacy-btn)
// Translates 115deg linear gradients, glossy highlight, dark icon panel,
// 3D bottom bevel, exact borders, drop shadows, and typography.
// ============================================================================
interface SetupButtonProps {
  icon: string | React.ReactNode;
  title: string;
  subtitle: string;
  gradientColors: readonly [string, string, ...string[]];
  gradientLocations?: readonly [number, number, ...number[]];
  panelColor: string;
  borderColor: string;
  bottomBevelColor?: string;
  accessibilityLabel: string;
  onPress?: () => void;
  isPrimaryAction?: boolean;
}

function SetupButton({
  icon,
  title,
  subtitle,
  gradientColors,
  gradientLocations,
  panelColor,
  borderColor,
  bottomBevelColor,
  accessibilityLabel,
  onPress,
  isPrimaryAction = false,
}: SetupButtonProps) {
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;

  const minHeight = isPrimaryAction ? (isNarrow ? 68 : 74) : isNarrow ? 63 : 68;
  const iconWidth = isNarrow ? 62 : 76;
  const iconFontSize = isNarrow ? 23 : (isPrimaryAction ? 28 : 26);
  const titleFontSize = isPrimaryAction ? (isNarrow ? 16 : 17) : (isNarrow ? 15 : 17);
  const subtitleFontSize = isNarrow ? 10 : 11;
  const bevelColor = bottomBevelColor ?? panelColor;

  const cardContent = (
    <View
      style={[
        styles.setupBtnWrapper,
        {
          minHeight,
          borderColor,
          borderBottomColor: bevelColor,
          borderRadius: isNarrow ? 9 : 13,
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        locations={gradientLocations}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 1, y: 0.9 }}
        style={[
          styles.setupBtnGradient,
          {
            minHeight: minHeight - 4,
            borderRadius: isNarrow ? 8 : 12,
          },
        ]}
      >
        {/* Glossy top-half highlight (.legacy-btn::before in CSS) */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.15)',
            'rgba(255, 255, 255, 0.025)',
            'transparent',
          ]}
          locations={[0, 0.5, 1.0]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.setupBtnGloss}
          pointerEvents="none"
        />

        {/* Solid dark icon panel (.btn-icon in CSS) */}
        <View
          style={[
            styles.setupBtnIconPanel,
            {
              width: iconWidth,
              backgroundColor: panelColor,
              minHeight: minHeight - 6,
            },
          ]}
        >
          {typeof icon === 'string' ? (
            <Text
              style={[
                styles.setupBtnIconText,
                { fontSize: iconFontSize },
              ]}
            >
              {icon}
            </Text>
          ) : (
            icon
          )}
        </View>

        {/* Button center label (.btn-label in CSS) */}
        <View style={styles.setupBtnLabel}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.setupBtnTitle, { fontSize: titleFontSize }]}
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.setupBtnSubtitle, { fontSize: subtitleFontSize }]}
          >
            {subtitle}
          </Text>
        </View>

        {/* Trailing arrow (.btn-arrow in CSS) */}
        <Text style={styles.setupBtnArrow} aria-hidden={true}>
          ›
        </Text>
      </LinearGradient>
    </View>
  );

  // If interactive (e.g. City card), wrap in Pressable; otherwise render non-interactive View
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          styles.setupBtnPressable,
          pressed && styles.setupBtnPressed,
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
      style={styles.setupBtnPressable}
    >
      {cardContent}
    </View>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('title');

  // Real save persistence does not exist yet. Kept false so we do not pretend
  // saved data exists.
  const hasExistingSave = false;

  // Character setup state (India-first defaults)
  const [surname] = useState<string>('Sharma');
  const [firstName, setFirstName] = useState<string>(() =>
    getRandomFirstName()
  );
  const [selectedCity, setSelectedCity] = useState<IndianCity>('Mumbai');

  // The refresh button is an active control on the setup screen:
  // generates a new random first name and immediately updates the Name card
  const handleRefreshName = () => {
    const nextName = getRandomFirstName(firstName);
    setFirstName(nextName);
  };

  // Window dimensions for responsive scaling on small / short screens
  const { width, height } = useWindowDimensions();
  const isShortScreen = height < 700;
  const isNarrowScreen = width < 360;

  // Sizing parameters derived from CSS media queries
  const logoSize = isShortScreen
    ? Math.min(width * 0.65, 260)
    : isNarrowScreen
    ? Math.min(width - 36, 290)
    : Math.min(width - 44, 340);

  const buttonMinHeight = isShortScreen ? 54 : isNarrowScreen ? 60 : 66;
  const buttonFontSize = isNarrowScreen ? 13 : 15;
  const buttonLetterSpacing = isNarrowScreen ? 1.0 : 1.5;
  const footerMarginTop = isShortScreen ? 22 : isNarrowScreen ? 28 : 36;

  // --------------------------------------------------------------------------
  // Animation state for the Welcome Screen
  // - Logo: glides up -48 points after 700ms over 2000ms (bezier(0.22, 1, 0.36, 1))
  // - Menu & Footer: fade in from opacity 0 to 1 after 2000ms over 1200ms
  // - Tracks hasAnimatedWelcome to avoid replaying unexpectedly on re-renders
  // - Honors system prefers-reduced-motion fallback
  // --------------------------------------------------------------------------
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimatedWelcome = useRef(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!isMounted) return;

        if (reduceMotion) {
          logoTranslateY.setValue(-48);
          contentOpacity.setValue(1);
          hasAnimatedWelcome.current = true;
          return;
        }

        if (hasAnimatedWelcome.current) {
          logoTranslateY.setValue(-48);
          contentOpacity.setValue(1);
          return;
        }

        // Timing curve matching CSS cubic-bezier(0.22, 1, 0.36, 1)
        const logoAnimation = Animated.timing(logoTranslateY, {
          toValue: -48,
          duration: 2000,
          delay: 700,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        });

        // Fade in matching CSS 1.2s ease 2s forwards
        const contentAnimation = Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 1200,
          delay: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        });

        Animated.parallel([logoAnimation, contentAnimation]).start(() => {
          if (isMounted) {
            hasAnimatedWelcome.current = true;
          }
        });
      })
      .catch(() => {
        // Fallback if AccessibilityInfo is unavailable
        if (!isMounted) return;
        logoTranslateY.setValue(-48);
        contentOpacity.setValue(1);
        hasAnimatedWelcome.current = true;
      });

    return () => {
      isMounted = false;
    };
  }, [logoTranslateY, contentOpacity]);

  return (
    <SafeAreaProvider>
      <View style={styles.appHost}>
      {currentScreen === 'character-setup' ? (
        <GoldBackgroundGradient
          style={styles.setupRootFill}
          pointerEvents="none"
        />
      ) : null}
      <SafeAreaView
        style={[
          styles.safeArea,
          currentScreen === 'character-setup' && styles.safeAreaSetup,
        ]}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {currentScreen === 'character-setup' ? (
            <SetupScrollArea>
              {/* ============================================================ */}
              {/* 2. CHARACTER SETUP — CSS 135deg gold wash + custom scrollbar */}
              {/* ============================================================ */}
              <GoldBackgroundGradient style={styles.setupScreenContainer}>
                {/* ── Topbar (.topbar in CSS) ── */}
                <GoldBackgroundGradient style={styles.setupTopbar}>
                  {/* Close button (×) — returns cleanly to welcome screen */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    onPress={() => setCurrentScreen('title')}
                    style={({ pressed }) => [
                      styles.iconButtonWrapper,
                      pressed && styles.iconButtonPressed,
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        'rgba(255, 255, 255, 0.65)',
                        'rgba(169, 154, 131, 0.14)',
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.8, y: 1 }}
                      style={styles.iconButtonGradient}
                    >
                      <Text style={styles.closeIconText}>×</Text>
                    </LinearGradient>
                  </Pressable>

                  {/* Brand */}
                  <Text style={styles.setupBrand}>Legacy</Text>

                  {/* Refresh button (↻) — generates a different random first name */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Refresh name"
                    onPress={handleRefreshName}
                    style={({ pressed }) => [
                      styles.iconButtonWrapper,
                      pressed && styles.iconButtonPressed,
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        'rgba(255, 255, 255, 0.65)',
                        'rgba(169, 154, 131, 0.14)',
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.8, y: 1 }}
                      style={styles.iconButtonGradient}
                    >
                      <Text style={styles.refreshIconText}>↻</Text>
                    </LinearGradient>
                  </Pressable>
                </GoldBackgroundGradient>

                {/* ── Intro Section (.intro in CSS) ── */}
                <GoldBackgroundGradient style={styles.setupIntro}>
                  <Text style={styles.setupIntroTitle}>Start a new life!</Text>
                  <Text style={styles.setupIntroSubtitle}>
                    Your story begins here.
                  </Text>
                </GoldBackgroundGradient>

                {/* ── Main Setup Cards (.setup in CSS) ── */}
                <GoldBackgroundGradient
                  style={[
                    styles.setupCardsSection,
                    isNarrowScreen && styles.setupCardsSectionNarrow,
                  ]}
                >
                  {/* 1. Start life — Emerald Green (Must do nothing when tapped) */}
                  <SetupButton
                    icon="🌱"
                    title="Start a new life!"
                    subtitle="Begin your journey"
                    gradientColors={['#0D5C3A', '#158754', '#1EAE6D']}
                    gradientLocations={[0, 0.48, 1.0]}
                    borderColor="#35B374"
                    bottomBevelColor="#072F1D"
                    panelColor="#094028"
                    isPrimaryAction
                    accessibilityLabel="Start a new life! Begin your journey"
                  />

                  {/* Divider (.divider in CSS) */}
                  <LinearGradient
                    colors={[
                      'transparent',
                      'rgba(120, 107, 86, 0.55)',
                      'transparent',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.setupDivider}
                  />

                  {/* 2. Name — Blue (Must do nothing when tapped) */}
                  <SetupButton
                    icon="👤"
                    title={`${firstName} ${surname}`}
                    subtitle="Click to change name"
                    gradientColors={['#174A78', '#287FC1', '#64B5F6']}
                    gradientLocations={[0, 0.55, 1.0]}
                    borderColor="#90CAF9"
                    bottomBevelColor="#123B64"
                    panelColor="#123B64"
                    accessibilityLabel={`Character name: ${firstName} ${surname}. Click to change name`}
                  />

                  {/* 3. Gender — Blue (Must do nothing when tapped) */}
                  <SetupButton
                    icon="♂"
                    title="Male"
                    subtitle="Click to change gender"
                    gradientColors={['#16456F', '#2585CC', '#64B5F6']}
                    gradientLocations={[0, 0.48, 1.0]}
                    borderColor="#90CAF9"
                    bottomBevelColor="#10365C"
                    panelColor="#10365C"
                    accessibilityLabel="Gender: Male. Click to change gender"
                  />

                  {/* 4. Country — Blue (Must do nothing when tapped) */}
                  <SetupButton
                    icon="🇮🇳"
                    title="India"
                    subtitle="Click to change country"
                    gradientColors={['#194B77', '#318BD0', '#64B5F6']}
                    gradientLocations={[0, 0.55, 1.0]}
                    borderColor="#90CAF9"
                    bottomBevelColor="#153D63"
                    panelColor="#153D63"
                    accessibilityLabel="Country: India. Click to change country"
                  />

                  {/* 5. City — Blue (ACTIVE! Preserves working city selection) */}
                  <SetupButton
                    icon="📍"
                    title={selectedCity}
                    subtitle="Click to change city"
                    gradientColors={['#194B77', '#318BD0', '#64B5F6']}
                    gradientLocations={[0, 0.55, 1.0]}
                    borderColor="#90CAF9"
                    bottomBevelColor="#153D63"
                    panelColor="#153D63"
                    accessibilityLabel={`City: ${selectedCity}. Click to change city`}
                    onPress={() => setCurrentScreen('city-picker')}
                  />

                  {/* Section Label: PERSONALIZE YOUR LIFE (.section-label in CSS) */}
                  <Text style={styles.setupSectionLabel}>
                    PERSONALIZE YOUR LIFE
                  </Text>

                  {/* 6. Special skill — Violet / Lavender / Mint (Must do nothing when tapped) */}
                  <SetupButton
                    icon="⚡"
                    title="Special skill"
                    subtitle="Choose your natural talent"
                    gradientColors={['#4e148c', '#4e148c', '#a882dd', '#b3ffb3']}
                    gradientLocations={[0, 0.20, 0.55, 1.0]}
                    borderColor="#7b4eb2"
                    bottomBevelColor="#32095e"
                    panelColor="#32095e"
                    accessibilityLabel="Special skill. Choose your natural talent"
                  />

                  {/* 7. Appearance — Magenta / Amber / Yellow (Must do nothing when tapped) */}
                  <SetupButton
                    icon="🎨"
                    title="Appearance"
                    subtitle="Customize your character"
                    gradientColors={['#f048c6', '#d7871e', '#f6ea41']}
                    gradientLocations={[0, 0.55, 1.0]}
                    borderColor="#f577d4"
                    bottomBevelColor="#7a1060"
                    panelColor="#7a1060"
                    accessibilityLabel="Appearance. Customize your character"
                  />

                  {/* 8. Attributes — Crimson / Coral / Cream (Must do nothing when tapped) */}
                  <SetupButton
                    icon="📊"
                    title="Attributes"
                    subtitle="Customize your abilities"
                    gradientColors={['#ec0958', '#df3d4d', '#fffbc8']}
                    gradientLocations={[0, 0.55, 1.0]}
                    borderColor="#f2467f"
                    bottomBevelColor="#78032a"
                    panelColor="#78032a"
                    accessibilityLabel="Attributes. Customize your abilities"
                  />
                </GoldBackgroundGradient>

                {/* ── Footer (.footer in CSS) ── */}
                <GoldBackgroundGradient style={styles.setupFooter}>
                  <Text style={styles.setupFooterText}>
                    LEGACY <Text style={styles.setupFooterDot}>·</Text> YOUR LIFE, YOUR STORY
                  </Text>
                </GoldBackgroundGradient>
              </GoldBackgroundGradient>
            </SetupScrollArea>
          ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            alwaysBounceVertical={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ============================================================== */}
            {/* 1. WELCOME SCREEN (ANIMATED HTML/CSS DESIGN REFERENCE)         */}
            {/* ============================================================== */}
            {currentScreen === 'title' && (
              <View style={styles.welcomeScreenContainer}>
                {/* Logo Container with Gliding Upward Animation */}
                <Animated.View
                  style={[
                    styles.logoContainer,
                    {
                      width: logoSize,
                      height: logoSize,
                      transform: [{ translateY: logoTranslateY }],
                    },
                  ]}
                >
                  <Image
                    source={require('./assets/logo.png')}
                    style={styles.gameLogo}
                    resizeMode="contain"
                    accessibilityLabel="LEGACY game logo"
                  />
                </Animated.View>

                {/* Content Container with Fade-in */}
                <Animated.View
                  style={[
                    styles.welcomeContent,
                    {
                      opacity: contentOpacity,
                    },
                  ]}
                >
                  {/* Menu Buttons Stack */}
                  <View style={styles.menuButtons}>
                    {/* Primary Button: START NEW LIFE */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Start new life"
                      onPress={() => setCurrentScreen('character-setup')}
                      style={({ pressed }) => [
                        styles.menuButton,
                        styles.startButton,
                        { minHeight: buttonMinHeight },
                        pressed && styles.menuButtonPressed,
                      ]}
                    >
                      {({ pressed }) => (
                        <View style={styles.buttonInnerRow}>
                          <Text
                            style={[
                              styles.menuButtonText,
                              styles.startButtonText,
                              {
                                fontSize: buttonFontSize,
                                letterSpacing: buttonLetterSpacing,
                              },
                            ]}
                          >
                            START NEW LIFE
                          </Text>
                          <Text
                            style={[
                              styles.buttonArrow,
                              styles.startButtonArrow,
                              pressed && styles.buttonArrowEmphasized,
                            ]}
                            aria-hidden={true}
                          >
                            ›
                          </Text>
                        </View>
                      )}
                    </Pressable>

                    {/* Secondary Button: LOAD PREVIOUS LIFE */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Load previous life"
                      onPress={() => {
                        if (hasExistingSave) {
                          // Future milestone: resume existing save game
                        } else {
                          setCurrentScreen('no-save-found');
                        }
                      }}
                      style={({ pressed }) => [
                        styles.menuButton,
                        styles.loadButton,
                        { minHeight: buttonMinHeight },
                        pressed && styles.menuButtonPressed,
                      ]}
                    >
                      {({ pressed }) => (
                        <View style={styles.buttonInnerRow}>
                          <Text
                            style={[
                              styles.menuButtonText,
                              styles.loadButtonText,
                              {
                                fontSize: buttonFontSize,
                                letterSpacing: buttonLetterSpacing,
                              },
                            ]}
                          >
                            LOAD PREVIOUS LIFE
                          </Text>
                          <Text
                            style={[
                              styles.buttonArrow,
                              styles.loadButtonArrow,
                              pressed && styles.buttonArrowEmphasized,
                            ]}
                            aria-hidden={true}
                          >
                            ›
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </View>

                  {/* Centered Footer */}
                  <Text
                    style={[
                      styles.footerText,
                      { marginTop: footerMarginTop },
                    ]}
                  >
                    YOUR LIFE. YOUR STORY.
                  </Text>
                </Animated.View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 3. CITY PICKER SCREEN (ACTIVE — Preserves working selection)   */}
            {/* ============================================================== */}
            {currentScreen === 'city-picker' && (
              <View style={styles.cityPickerContainer}>
                <View style={styles.cityPickerHeaderGroup}>
                  <Text style={styles.heading}>CHOOSE YOUR CITY</Text>
                  <Text style={styles.instruction}>Select a city in India.</Text>
                </View>

                <View style={styles.citiesGrid}>
                  {INDIAN_CITIES.map((city) => {
                    const isSelected = selectedCity === city;
                    return (
                      <TouchableOpacity
                        key={city}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedCity(city);
                          setCurrentScreen('character-setup');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Select city ${city}`}
                        accessibilityState={{ selected: isSelected }}
                        style={[
                          styles.cityOptionButton,
                          isSelected
                            ? styles.cityOptionButtonSelected
                            : styles.cityOptionButtonUnselected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.cityOptionButtonText,
                            isSelected
                              ? styles.cityOptionButtonTextSelected
                              : styles.cityOptionButtonTextUnselected,
                          ]}
                        >
                          {city}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.cityPickerActionsGroup}>
                  <AppButton
                    title="BACK"
                    variant="secondary"
                    onPress={() => setCurrentScreen('character-setup')}
                  />
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 4. NO SAVED LIVES FOUND                                         */}
            {/* ============================================================== */}
            {currentScreen === 'no-save-found' && (
              <View style={styles.placeholderContainer}>
                <View style={styles.placeholderContent}>
                  <Text style={styles.heading}>NO SAVED LIVES FOUND</Text>
                  <Text style={styles.placeholderNotice}>
                    No saved lives found.{'\n'}Start a new life to begin your legacy.
                  </Text>
                </View>

                <View style={styles.menuButtonGroup}>
                  <AppButton
                    title="BACK"
                    variant="secondary"
                    onPress={() => setCurrentScreen('title')}
                  />
                </View>
              </View>
            )}
          </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

// ============================================================================
// STYLESHEET
// Faithfully matches HTML/CSS reference specifications
// ============================================================================
const styles = StyleSheet.create({
  appHost: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: THEME.cream,
  },
  safeAreaSetup: {
    backgroundColor: 'transparent',
  },
  setupRootFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  setupScrollArea: {
    flex: 1,
    position: 'relative',
  },
  setupScrollView: {
    flex: 1,
  },
  setupScrollContent: {
    flexGrow: 1,
  },
  setupScrollbarTrack: {
    position: 'absolute',
    top: SETUP_SCROLLBAR.inset,
    bottom: SETUP_SCROLLBAR.inset,
    right: SETUP_SCROLLBAR.right,
    width: SETUP_SCROLLBAR.width,
    borderRadius: 999,
    backgroundColor: SETUP_SCROLLBAR.trackColor,
    overflow: 'hidden',
  },
  setupScrollbarThumb: {
    width: SETUP_SCROLLBAR.width,
    borderRadius: 999,
  },

  // ==========================================================================
  // WELCOME SCREEN STYLES
  // ==========================================================================
  welcomeScreenContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 520,
  },
  logoContainer: {
    aspectRatio: 1,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gameLogo: {
    width: '100%',
    height: '100%',
  },
  welcomeContent: {
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  menuButtons: {
    width: '100%',
    gap: 15,
  },
  menuButton: {
    position: 'relative',
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: THEME.black,
    borderColor: THEME.black,
  },
  loadButton: {
    backgroundColor: 'transparent',
    borderColor: THEME.gold,
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    width: '100%',
  },
  menuButtonText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontWeight: '700',
    textAlign: 'left',
  },
  startButtonText: {
    color: THEME.white,
  },
  loadButtonText: {
    color: THEME.ink,
  },
  buttonArrow: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 22,
    lineHeight: 24,
  },
  startButtonArrow: {
    color: THEME.white,
  },
  loadButtonArrow: {
    color: THEME.gold,
  },
  buttonArrowEmphasized: {
    opacity: 0.6,
  },
  menuButtonPressed: {
    opacity: 0.88,
  },
  footerText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    textAlign: 'center',
    color: THEME.footer,
  },

  // ==========================================================================
  // CHARACTER SETUP SCREEN STYLES (Exact reproduction of style2.css)
  // ==========================================================================
  setupScreenContainer: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    paddingBottom: 22,
  },
  setupTopbar: {
    height: 62,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 107, 86, 0.45)',
  },
  iconButtonWrapper: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#786B56',
    overflow: 'hidden',
  },
  iconButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  iconButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    fontSize: 27,
    fontWeight: '500',
    color: '#211F1C',
    lineHeight: 28,
    textAlign: 'center',
  },
  refreshIconText: {
    fontSize: 25,
    fontWeight: '800',
    color: '#211F1C',
    lineHeight: 26,
    textAlign: 'center',
  },
  setupBrand: {
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.8,
    color: '#211F1C',
  },
  setupIntro: {
    minHeight: 88,
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 107, 86, 0.45)',
  },
  setupIntroTitle: {
    color: '#211F1C',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  setupIntroSubtitle: {
    marginTop: 3,
    color: '#514738',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  setupCardsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 13,
    paddingTop: 23,
    paddingHorizontal: 20,
  },
  setupCardsSectionNarrow: {
    paddingHorizontal: 14,
    gap: 12,
  },

  // Setup Button Cards (.legacy-btn translation)
  setupBtnPressable: {
    width: '100%',
  },
  setupBtnPressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.95,
  },
  setupBtnWrapper: {
    width: '100%',
    borderWidth: 1,
    borderBottomWidth: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  setupBtnGradient: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    position: 'relative',
  },
  setupBtnGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    zIndex: 2,
  },
  setupBtnIconPanel: {
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.15)',
  },
  setupBtnIconText: {
    color: '#FFFFFF',
    lineHeight: 32,
    textAlign: 'center',
  },
  setupBtnLabel: {
    zIndex: 3,
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 2,
  },
  setupBtnTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 22,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  setupBtnSubtitle: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 16,
    textAlign: 'center',
  },
  setupBtnArrow: {
    zIndex: 3,
    alignSelf: 'center',
    width: 27,
    marginRight: 8,
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '400',
    lineHeight: 27,
    textAlign: 'center',
  },

  // Divider (.divider in CSS)
  setupDivider: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 3,
  },

  // Section Label (.section-label in CSS)
  setupSectionLabel: {
    marginTop: 7,
    marginLeft: 2,
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  // Footer (.footer in CSS)
  setupFooter: {
    marginTop: 27,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupFooterText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  setupFooterDot: {
    color: '#000000',
  },

  // ==========================================================================
  // CITY PICKER SCREEN STYLES
  // ==========================================================================
  cityPickerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  cityPickerHeaderGroup: {
    alignItems: 'center',
    marginBottom: 16,
  },
  citiesGrid: {
    width: '100%',
    marginBottom: 8,
  },
  cityOptionButton: {
    width: '100%',
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  cityOptionButtonUnselected: {
    backgroundColor: THEME.warmGreyBeige,
    borderWidth: 1,
    borderColor: THEME.warmGreyBeige,
  },
  cityOptionButtonSelected: {
    backgroundColor: THEME.black,
    borderWidth: 1,
    borderColor: THEME.black,
  },
  cityOptionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  cityOptionButtonTextUnselected: {
    color: THEME.black,
  },
  cityOptionButtonTextSelected: {
    color: THEME.white,
  },
  cityPickerActionsGroup: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
  },

  // ==========================================================================
  // INFORMATIONAL SCREEN STYLES (No Saved Lives)
  // ==========================================================================
  placeholderContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'space-between',
    minHeight: 480,
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: THEME.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 13,
    color: '#514738',
    textAlign: 'center',
    marginBottom: 16,
  },
  placeholderNotice: {
    color: THEME.black,
    fontSize: 14,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 20,
  },
  menuButtonGroup: {
    width: '100%',
    alignItems: 'center',
  },

  // Standard Form Buttons
  standardButtonBase: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  standardButtonPrimary: {
    backgroundColor: THEME.black,
  },
  standardButtonSecondary: {
    backgroundColor: THEME.warmGreyBeige,
  },
  standardButtonTextBase: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  standardButtonTextPrimary: {
    color: THEME.white,
  },
  standardButtonTextSecondary: {
    color: THEME.black,
  },
});
