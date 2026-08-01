export const Typography = {
  'display-xl': {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 40,
    lineHeight: 46, // 1.15 * 40
    letterSpacing: -0.8, // -0.02 * 40
  },
  'display-lg': {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 32,
    lineHeight: 38.4, // 1.2 * 32
    letterSpacing: -0.32, // -0.01 * 32
  },
  'h1': {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
    lineHeight: 31.2, // 1.3 * 24
  },
  'h2': {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    lineHeight: 27, // 1.35 * 20
  },
  'h3': {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 25.2, // 1.4 * 18
  },
  'h4': {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22.4, // 1.4 * 16
  },
  'body-lg': {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 25.6, // 1.6 * 16
  },
  'body': {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22.4, // 1.6 * 14
  },
  'body-sm': {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20.15, // 1.55 * 13
  },
  'label-lg': {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 19.6, // 1.4 * 14
    letterSpacing: 0.14, // 0.01 * 14
  },
  'label': {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16.8, // 1.4 * 12
    letterSpacing: 0.24, // 0.02 * 12
  },
  'caption': {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18, // 1.5 * 12
  },
  'time': {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
  },
  'mono': {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
  },
  /** Smaller mono variant used for reference IDs, codes. */
  'mono-sm': {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
  },
  /** Primary action button label. */
  'button': {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22.4,
    letterSpacing: 0.16,
  },
};

export const TypographyFamilies = {
  jakarta: 'PlusJakartaSans_700Bold',
  jakartaBold: 'PlusJakartaSans_800ExtraBold',
  inter: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  bengali: 'NotoSansBengali_400Regular',
  bengaliSemiBold: 'NotoSansBengali_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
};

export const BengaliRules = {
  minFontSize: 14,
  minLineHeight: 1.7,
};
