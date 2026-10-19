import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  AccessibilityInfo,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// ============================================================================
// VISUAL DESIGN PALETTE — WELCOME SCREEN & CORE THEME
// Derived directly from the provided reference specification:
// - Cream background:   #F5F3E8
// - Primary black:      #080808
// - Main text (ink):    #171512
// - Muted gold border:  #A99A7D
// - Secondary gold:     #D0C4AB
// - Footer text:        #777267
// - Pure white:         #FFFFFF
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

// Screen identifiers for simple state-based navigation
type Screen =
  | 'title'
  | 'start-menu'
  | 'family-creation'
  | 'character-basic-info'
  | 'character-review'
  | 'no-save-found';

type Gender = 'male' | 'female';

// ============================================================================
// CURATED LOCAL INDIAN NAMES POOLS
// All data is kept local — no external APIs, accounts, or services.
// ============================================================================
const INDIAN_SURNAMES: readonly string[] = [
  'Sharma',
  'Patel',
  'Mehta',
  'Iyer',
  'Nair',
  'Gupta',
  'Deshmukh',
  'Kulkarni',
  'Reddy',
  'Verma',
  'Chatterjee',
  'Joshi',
  'Rao',
  'Bhat',
  'Chauhan',
  'Banerjee',
  'Mukherjee',
  'Gill',
  'Kapoor',
  'Menon',
  'Singhania',
  'Bose',
  'Mishra',
  'Agarwal',
  'Pillai',
  'Malhotra',
  'Bhattacharya',
  'Naidu',
  'Choudhury',
  'Kaur',
  'Das',
  'Hegde',
  'Saxena',
  'Chawla',
  'Ghosh',
  'Pandey',
  'Goswami',
  'Acharya',
  'Trivedi',
  'Yadav',
];

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

const INDIAN_FEMALE_FIRST_NAMES: readonly string[] = [
  'Aanya',
  'Diya',
  'Saanvi',
  'Zara',
  'Pari',
  'Ananya',
  'Riya',
  'Meera',
  'Kavya',
  'Avani',
  'Ishita',
  'Pooja',
  'Sneha',
  'Shreya',
  'Tanya',
  'Priya',
  'Anika',
  'Aditi',
  'Tanvi',
  'Divya',
  'Maya',
  'Riddhi',
  'Tara',
  'Neha',
  'Nandini',
];

/**
 * Generates three unique random surnames from the pool, avoiding current duplicates.
 */
function getThreeRandomSurnames(exclude: string[] = []): string[] {
  const available = INDIAN_SURNAMES.filter((name) => !exclude.includes(name));
  const pool = available.length >= 3 ? available : [...INDIAN_SURNAMES];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

/**
 * Generates a random Indian first name.
 * Uses gender-specific pool if selected, otherwise combined pool.
 * Avoids returning the currently active name if alternatives exist.
 */
function getRandomFirstName(
  gender: Gender | null,
  currentName: string = ''
): string {
  let pool: readonly string[];
  if (gender === 'male') {
    pool = INDIAN_MALE_FIRST_NAMES;
  } else if (gender === 'female') {
    pool = INDIAN_FEMALE_FIRST_NAMES;
  } else {
    pool = [...INDIAN_MALE_FIRST_NAMES, ...INDIAN_FEMALE_FIRST_NAMES];
  }

  const normalizedCurrent = currentName.trim().toLowerCase();
  const candidates = pool.filter(
    (name) => name.toLowerCase() !== normalizedCurrent
  );
  const activePool = candidates.length > 0 ? candidates : pool;
  const randomIndex = Math.floor(Math.random() * activePool.length);
  return activePool[randomIndex];
}

// ============================================================================
// REUSABLE STANDARD BUTTON (Used on inner forms)
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
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('title');

  // Real save persistence does not exist yet. Kept false so we do not pretend
  // saved data exists (respects requirement 6).
  const hasExistingSave = false;

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

    // Check system preference for reduced motion
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!isMounted) return;

        if (reduceMotion) {
          // Non-animated fallback: settle immediately at final positions
          logoTranslateY.setValue(-48);
          contentOpacity.setValue(1);
          hasAnimatedWelcome.current = true;
          return;
        }

        if (hasAnimatedWelcome.current) {
          // If already animated once in this session, keep final resting state
          logoTranslateY.setValue(-48);
          contentOpacity.setValue(1);
          return;
        }

        hasAnimatedWelcome.current = true;

        // 1. Independent logo animation: Delay 700ms, duration 2000ms
        Animated.timing(logoTranslateY, {
          toValue: -48,
          duration: 2000,
          delay: 700,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }).start();

        // 2. Independent menu fade-in: Delay 2000ms, duration 1200ms
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 1200,
          delay: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      })
      .catch(() => {
        if (!isMounted) return;
        if (hasAnimatedWelcome.current) {
          logoTranslateY.setValue(-48);
          contentOpacity.setValue(1);
          return;
        }
        hasAnimatedWelcome.current = true;
        Animated.timing(logoTranslateY, {
          toValue: -48,
          duration: 2000,
          delay: 700,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }).start();
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 1200,
          delay: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      });

    return () => {
      isMounted = false;
    };
  }, [logoTranslateY, contentOpacity]);

  // --------------------------------------------------------------------------
  // Family creation state
  // --------------------------------------------------------------------------
  const [generatedSurnames, setGeneratedSurnames] = useState<string[]>(() =>
    getThreeRandomSurnames()
  );
  const [selectedGeneratedSurname, setSelectedGeneratedSurname] = useState<
    string | null
  >(null);
  const [customSurname, setCustomSurname] = useState<string>('');
  const [surnameValidationError, setSurnameValidationError] = useState<
    string | null
  >(null);
  const [confirmedSurname, setConfirmedSurname] = useState<string>('');

  // --------------------------------------------------------------------------
  // Character basic information state
  // --------------------------------------------------------------------------
  const [firstName, setFirstName] = useState<string>('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [nameValidationError, setNameValidationError] = useState<string | null>(
    null
  );
  const [genderValidationError, setGenderValidationError] = useState<
    string | null
  >(null);

  // --------------------------------------------------------------------------
  // Family surname handlers
  // --------------------------------------------------------------------------
  const handleSelectGeneratedSurname = (surname: string) => {
    setSelectedGeneratedSurname(surname);
    setCustomSurname('');
    setSurnameValidationError(null);
  };

  const handleCustomSurnameChange = (text: string) => {
    setCustomSurname(text);
    setSelectedGeneratedSurname(null);
    setSurnameValidationError(null);
  };

  const handleGenerateAnotherSurname = () => {
    const nextThree = getThreeRandomSurnames(generatedSurnames);
    setGeneratedSurnames(nextThree);
    if (
      selectedGeneratedSurname &&
      !nextThree.includes(selectedGeneratedSurname)
    ) {
      setSelectedGeneratedSurname(null);
    }
    setSurnameValidationError(null);
  };

  const handleContinueFromSurname = () => {
    const rawSurname = selectedGeneratedSurname || customSurname;
    const trimmed = rawSurname.trim();

    if (!trimmed) {
      setSurnameValidationError('Please choose or enter a family surname.');
      return;
    }

    if (trimmed.length < 2) {
      setSurnameValidationError(
        'Surname must be at least 2 characters long.'
      );
      return;
    }

    const surnameRegex = /^[A-Za-z\s'-]+$/;
    if (!surnameRegex.test(trimmed)) {
      setSurnameValidationError(
        'Surname can only contain letters, hyphens, spaces, and apostrophes.'
      );
      return;
    }

    setSurnameValidationError(null);
    setConfirmedSurname(trimmed);
    setCurrentScreen('character-basic-info');
  };

  // --------------------------------------------------------------------------
  // Character info handlers
  // --------------------------------------------------------------------------
  const handleGenerateRandomName = () => {
    const randomName = getRandomFirstName(gender, firstName);
    setFirstName(randomName);
    setNameValidationError(null);
  };

  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    setNameValidationError(null);
  };

  const handleSelectGender = (selected: Gender) => {
    setGender(selected);
    setGenderValidationError(null);
  };

  const handleContinueFromCharacterInfo = () => {
    let hasError = false;

    const trimmedFirstName = firstName.trim();
    if (!trimmedFirstName) {
      setNameValidationError('Please enter or generate a first name.');
      hasError = true;
    } else if (trimmedFirstName.length < 2) {
      setNameValidationError('First name must be at least 2 characters long.');
      hasError = true;
    } else if (!/^[A-Za-z\s'-]+$/.test(trimmedFirstName)) {
      setNameValidationError(
        'First name can only contain letters, hyphens, spaces, and apostrophes.'
      );
      hasError = true;
    } else {
      setNameValidationError(null);
    }

    if (!gender) {
      setGenderValidationError('Please choose a gender (♂ MALE or ♀ FEMALE).');
      hasError = true;
    } else {
      setGenderValidationError(null);
    }

    if (hasError) {
      return;
    }

    setFirstName(trimmedFirstName);
    setCurrentScreen('character-review');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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

                {/* Content Container with Fade-in (No Sliding) */}
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
                      onPress={() => setCurrentScreen('family-creation')}
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
                    {/* Always visible; navigates to no-save-found until persistence is implemented */}
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
            {/* 2. CREATE A NEW FAMILY (SURNAME SELECTION)                     */}
            {/* ============================================================== */}
            {currentScreen === 'family-creation' && (
              <View style={styles.formScreenContainer}>
                <View style={styles.formHeaderGroup}>
                  <Text style={styles.heading}>CREATE YOUR FAMILY</Text>
                  <Text style={styles.instruction}>
                    Choose your family surname to begin your legacy.
                  </Text>
                </View>

                {/* Section A: Surnames Options */}
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionLabel}>CHOOSE A SURNAME</Text>
                  <View style={styles.surnamesList}>
                    {generatedSurnames.map((name) => {
                      const isSelected = selectedGeneratedSurname === name;
                      return (
                        <TouchableOpacity
                          key={name}
                          activeOpacity={0.8}
                          onPress={() => handleSelectGeneratedSurname(name)}
                          accessibilityRole="button"
                          accessibilityLabel={`Select surname ${name}`}
                          accessibilityState={{ selected: isSelected }}
                          style={[
                            styles.optionButton,
                            isSelected
                              ? styles.optionButtonSelected
                              : styles.optionButtonUnselected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionButtonText,
                              isSelected
                                ? styles.optionButtonTextSelected
                                : styles.optionButtonTextUnselected,
                            ]}
                          >
                            {name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <AppButton
                    title="GENERATE ANOTHER"
                    variant="secondary"
                    height={46}
                    onPress={handleGenerateAnotherSurname}
                  />
                </View>

                {/* Section B: Custom Surname Input */}
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionLabel}>
                    OR ENTER YOUR OWN SURNAME
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter family surname"
                    placeholderTextColor={THEME.black}
                    value={customSurname}
                    onChangeText={handleCustomSurnameChange}
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={32}
                    accessibilityLabel="Enter custom family surname"
                  />
                </View>

                {/* Validation Error Banner */}
                {surnameValidationError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                      {surnameValidationError}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.formActionsGroup}>
                  <AppButton
                    title="CONTINUE"
                    variant="primary"
                    onPress={handleContinueFromSurname}
                  />
                  <AppButton
                    title="BACK"
                    variant="secondary"
                    onPress={() => setCurrentScreen('title')}
                  />
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 3. CHARACTER BASIC INFORMATION SCREEN                         */}
            {/* ============================================================== */}
            {currentScreen === 'character-basic-info' && (
              <View style={styles.formScreenContainer}>
                {/* Header & Subtext */}
                <View style={styles.formHeaderGroup}>
                  <Text style={styles.heading}>CREATE YOUR CHARACTER</Text>
                  <Text style={styles.instruction}>
                    Family Surname:{' '}
                    <Text style={styles.instructionBold}>
                      {confirmedSurname}
                    </Text>
                  </Text>
                </View>

                {/* Section A: First Name */}
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionLabel}>CHARACTER FIRST NAME</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter first name"
                    placeholderTextColor={THEME.black}
                    value={firstName}
                    onChangeText={handleFirstNameChange}
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={32}
                    accessibilityLabel="Character first name"
                  />

                  {nameValidationError && (
                    <Text style={styles.fieldErrorText}>
                      {nameValidationError}
                    </Text>
                  )}

                  <AppButton
                    title="GENERATE RANDOM NAME"
                    variant="secondary"
                    height={46}
                    onPress={handleGenerateRandomName}
                  />
                </View>

                {/* Section B: Gender Selection */}
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionLabel}>CHOOSE GENDER</Text>
                  <View style={styles.genderRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleSelectGender('male')}
                      accessibilityRole="button"
                      accessibilityLabel="Select gender Male"
                      accessibilityState={{ selected: gender === 'male' }}
                      style={[
                        styles.genderButton,
                        gender === 'male'
                          ? styles.genderButtonSelected
                          : styles.genderButtonUnselected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          gender === 'male'
                            ? styles.genderButtonTextSelected
                            : styles.genderButtonTextUnselected,
                        ]}
                      >
                        ♂ MALE
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleSelectGender('female')}
                      accessibilityRole="button"
                      accessibilityLabel="Select gender Female"
                      accessibilityState={{ selected: gender === 'female' }}
                      style={[
                        styles.genderButton,
                        gender === 'female'
                          ? styles.genderButtonSelected
                          : styles.genderButtonUnselected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          gender === 'female'
                            ? styles.genderButtonTextSelected
                            : styles.genderButtonTextUnselected,
                        ]}
                      >
                        ♀ FEMALE
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {genderValidationError && (
                    <Text style={styles.fieldErrorText}>
                      {genderValidationError}
                    </Text>
                  )}
                </View>

                {/* Section C: Action Buttons */}
                <View style={styles.formActionsGroup}>
                  <AppButton
                    title="CONTINUE"
                    variant="primary"
                    onPress={handleContinueFromCharacterInfo}
                  />
                  <AppButton
                    title="BACK"
                    variant="secondary"
                    onPress={() => setCurrentScreen('family-creation')}
                  />
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 4. CHARACTER REVIEW (TEMPORARY PLACEHOLDER)                    */}
            {/* ============================================================== */}
            {currentScreen === 'character-review' && (
              <View style={styles.placeholderContainer}>
                <View style={styles.placeholderContent}>
                  <Text style={styles.heading}>CHARACTER REVIEW</Text>

                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Full Name</Text>
                      <Text style={styles.summaryValueBold}>
                        {firstName} {confirmedSurname}
                      </Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>First Name</Text>
                      <Text style={styles.summaryValue}>{firstName}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Family Surname</Text>
                      <Text style={styles.summaryValue}>{confirmedSurname}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Gender</Text>
                      <Text style={styles.summaryValue}>
                        {gender === 'male' ? '♂ MALE' : '♀ FEMALE'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.placeholderNotice}>
                    Next steps: Adult appearance customisation and parent
                    generation.
                  </Text>
                </View>

                <View style={styles.menuButtonGroup}>
                  <AppButton
                    title="BACK"
                    variant="secondary"
                    onPress={() => setCurrentScreen('character-basic-info')}
                  />
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 5. NO SAVED LIVES FOUND                                         */}
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

        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ============================================================================
// STYLESHEET
// Faithfully matches HTML/CSS reference:
// - Background: #F5F3E8
// - Primary Black: #080808
// - Ink text: #171512
// - Muted gold border: #A99A7D
// - Secondary gold: #D0C4AB
// - Footer text: #777267
// ============================================================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.cream,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ==========================================================================
  // WELCOME SCREEN STYLES (Direct translation of reference CSS)
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
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  menuButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonInnerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
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
  menuButtonText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontWeight: '800',
    textAlign: 'center',
  },
  startButtonText: {
    color: THEME.white,
  },
  loadButtonText: {
    color: THEME.ink,
  },
  buttonArrow: {
    position: 'absolute',
    right: 0,
    fontSize: 25,
    fontWeight: '400',
    opacity: 0.5,
  },
  startButtonArrow: {
    color: THEME.white,
  },
  loadButtonArrow: {
    color: THEME.ink,
  },
  buttonArrowEmphasized: {
    opacity: 1,
  },
  footerText: {
    color: THEME.footer,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    textAlign: 'center',
  },

  // ==========================================================================
  // INNER FORM SCREENS STYLES
  // ==========================================================================
  formScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  formHeaderGroup: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    color: THEME.black,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  instruction: {
    color: THEME.black,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  instructionBold: {
    fontWeight: '700',
  },
  sectionGroup: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 18,
  },
  sectionLabel: {
    color: THEME.black,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    textAlign: 'center',
  },
  surnamesList: {
    width: '100%',
    marginBottom: 4,
  },
  optionButton: {
    width: '100%',
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  optionButtonUnselected: {
    backgroundColor: THEME.warmGreyBeige,
    borderWidth: 1,
    borderColor: THEME.warmGreyBeige,
  },
  optionButtonSelected: {
    backgroundColor: THEME.black,
    borderWidth: 1,
    borderColor: THEME.black,
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  optionButtonTextUnselected: {
    color: THEME.black,
  },
  optionButtonTextSelected: {
    color: THEME.white,
  },
  textInput: {
    width: '100%',
    height: 50,
    backgroundColor: THEME.cream,
    borderWidth: 1,
    borderColor: THEME.black,
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 15,
    color: THEME.black,
    marginBottom: 8,
  },

  // Gender Buttons Row
  genderRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  genderButtonUnselected: {
    backgroundColor: THEME.warmGreyBeige,
    borderWidth: 1,
    borderColor: THEME.warmGreyBeige,
  },
  genderButtonSelected: {
    backgroundColor: THEME.black,
    borderWidth: 1,
    borderColor: THEME.black,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  genderButtonTextUnselected: {
    color: THEME.black,
  },
  genderButtonTextSelected: {
    color: THEME.white,
  },

  // Error Messages
  errorContainer: {
    width: '100%',
    maxWidth: 320,
    padding: 10,
    backgroundColor: THEME.warmGreyBeige,
    borderWidth: 1,
    borderColor: THEME.black,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: THEME.black,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  fieldErrorText: {
    color: THEME.black,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: -2,
    letterSpacing: 0.2,
  },
  formActionsGroup: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },

  // Review Placeholder Screen
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    minHeight: 520,
  },
  placeholderContent: {
    marginBottom: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: THEME.warmGreyBeige,
    borderWidth: 1,
    borderColor: THEME.black,
    borderRadius: 6,
    padding: 18,
    marginVertical: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: THEME.black,
    marginVertical: 8,
    opacity: 0.2,
  },
  summaryLabel: {
    color: THEME.black,
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    color: THEME.black,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValueBold: {
    color: THEME.black,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
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
