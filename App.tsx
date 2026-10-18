import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// ============================================================================
// DESIGN IDENTITY — STRICT COLOR PALETTE
// ONLY three colours are permitted throughout the application:
// - Background & Light Text: #F5F4EB (Off-white)
// - Primary Surfaces & Text:  #000000 (Black)
// - Secondary Surfaces:       #E8E4D9 (Warm grey-beige)
// ============================================================================
const COLORS = {
  black: '#000000',
  offWhite: '#F5F4EB',
  warmGreyBeige: '#E8E4D9',
} as const;

// Screen identifiers for simple state-based navigation
type Screen =
  | 'title'
  | 'start-menu'
  | 'family-creation'
  | 'character-basic-info'
  | 'character-review';

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
// REUSABLE BUTTON COMPONENT
// - Rectangular with slightly rounded corners (borderRadius: 6, never pill-shaped)
// - Accessible touch targets (height: 52px default)
// - Primary: Black background with Off-white text
// - Secondary: Warm grey-beige background with Black text
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
        styles.buttonBase,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        height ? { height } : null,
      ]}
    >
      <Text
        style={[
          styles.buttonTextBase,
          isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary,
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

  // Real save persistence does not exist yet. Kept false to avoid fake saves.
  const hasExistingSave = false;

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
  // Family surname handlers (mutually exclusive)
  // --------------------------------------------------------------------------
  const handleSelectGeneratedSurname = (surname: string) => {
    setSelectedGeneratedSurname(surname);
    setCustomSurname(''); // clear custom text when a generated option is chosen
    setSurnameValidationError(null);
  };

  const handleCustomSurnameChange = (text: string) => {
    setCustomSurname(text);
    setSelectedGeneratedSurname(null); // clear generated option when typing
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
    // Transition cleanly to character basic info
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
    // Note: Does not silently alter or erase the player's typed first name.
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

    // Normalise trimmed first name
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
            {/* 1. TITLE SCREEN                                                */}
            {/* ============================================================== */}
            {currentScreen === 'title' && (
              <View style={styles.titleScreenContainer}>
                {/* Logo: Preserves exact aspect ratio, no cropping or distortion */}
                <Image
                  source={require('./assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                  accessibilityLabel="Legacy logo"
                />

                {/* Tagline and Button visually grouped together */}
                <View style={styles.titleActionGroup}>
                  <Text style={styles.tagline}>Every life leaves a mark.</Text>

                  {/* 22 points of vertical spacing directly below tagline */}
                  <View style={styles.taglineSpacing}>
                    <AppButton
                      title="BEGIN YOUR STORY"
                      variant="primary"
                      onPress={() => setCurrentScreen('start-menu')}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 2. START MENU                                                  */}
            {/* ============================================================== */}
            {currentScreen === 'start-menu' && (
              <View style={styles.startMenuContainer}>
                <View style={styles.startMenuHeader}>
                  <Text style={styles.heading}>BEGIN YOUR STORY</Text>
                </View>

                <View style={styles.menuButtonGroup}>
                  <AppButton
                    title="CREATE A NEW FAMILY"
                    variant="primary"
                    onPress={() => setCurrentScreen('family-creation')}
                  />

                  {/* Only rendered when a genuine saved game exists */}
                  {hasExistingSave && (
                    <AppButton
                      title="CONTINUE EXISTING SAVE"
                      variant="secondary"
                      onPress={() => {
                        // Future milestone: resume existing saved game
                      }}
                    />
                  )}

                  <AppButton
                    title="BACK"
                    variant="secondary"
                    onPress={() => setCurrentScreen('title')}
                  />
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 3. CREATE A NEW FAMILY (SURNAME SELECTION)                     */}
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
                    placeholderTextColor={COLORS.black}
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
                    onPress={() => setCurrentScreen('start-menu')}
                  />
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 4. CHARACTER BASIC INFORMATION SCREEN                         */}
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
                    placeholderTextColor={COLORS.black}
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
            {/* 5. CHARACTER REVIEW (TEMPORARY PLACEHOLDER)                    */}
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
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ============================================================================
// STYLESHEET
// Color palette strictly limited to:
// - #000000 (Black)
// - #F5F4EB (Off-white)
// - #E8E4D9 (Warm grey-beige)
// Rectangular buttons with slightly rounded corners (borderRadius: 6).
// No shadows, gradients, or decorative elements.
// ============================================================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Title Screen: Centered, grouped tagline and button
  titleScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    minHeight: 520,
  },
  logoImage: {
    width: 220,
    height: 220,
    marginBottom: 28,
  },
  titleActionGroup: {
    width: '100%',
    alignItems: 'center',
  },
  tagline: {
    color: COLORS.black,
    fontSize: 16,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  taglineSpacing: {
    width: '100%',
    alignItems: 'center',
    marginTop: 22, // 20–24 points of spacing directly below tagline
  },

  // Start Menu
  startMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    minHeight: 520,
  },
  startMenuHeader: {
    marginBottom: 36,
    alignItems: 'center',
  },
  heading: {
    color: COLORS.black,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  menuButtonGroup: {
    width: '100%',
    alignItems: 'center',
  },

  // Form Screens (Family Creation & Character Basic Info)
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
  instruction: {
    color: COLORS.black,
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
    color: COLORS.black,
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
    backgroundColor: COLORS.warmGreyBeige,
    borderWidth: 1,
    borderColor: COLORS.warmGreyBeige,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  optionButtonTextUnselected: {
    color: COLORS.black,
  },
  optionButtonTextSelected: {
    color: COLORS.offWhite,
  },
  textInput: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.offWhite,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.black,
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
    backgroundColor: COLORS.warmGreyBeige,
    borderWidth: 1,
    borderColor: COLORS.warmGreyBeige,
  },
  genderButtonSelected: {
    backgroundColor: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  genderButtonTextUnselected: {
    color: COLORS.black,
  },
  genderButtonTextSelected: {
    color: COLORS.offWhite,
  },

  // Error Messages
  errorContainer: {
    width: '100%',
    maxWidth: 320,
    padding: 10,
    backgroundColor: COLORS.warmGreyBeige,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.black,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  fieldErrorText: {
    color: COLORS.black,
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
    backgroundColor: COLORS.warmGreyBeige,
    borderWidth: 1,
    borderColor: COLORS.black,
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
    backgroundColor: COLORS.black,
    marginVertical: 8,
    opacity: 0.2,
  },
  summaryLabel: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValueBold: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  placeholderNotice: {
    color: COLORS.black,
    fontSize: 14,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Button Styles
  buttonBase: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  buttonPrimary: {
    backgroundColor: COLORS.black,
  },
  buttonSecondary: {
    backgroundColor: COLORS.warmGreyBeige,
  },
  buttonTextBase: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  buttonTextPrimary: {
    color: COLORS.offWhite,
  },
  buttonTextSecondary: {
    color: COLORS.black,
  },
});
