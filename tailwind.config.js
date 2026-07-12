/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Keep in sync with constants/theme.ts AppColors
      colors: {
        background:      '#FFFFFF',
        surface:         '#F7F7F8',
        elevated:        '#FFFFFF',
        border:          '#E6E6E9',
        text:            '#0D0D14',
        'text-secondary': '#6B6B7B',
        accent:          '#3B82F6',
        'accent-light':  '#EFF5FF',
        premium:         '#9B59B6',
        success:         '#22C55E',
      },
      // Keep in sync with constants/theme.ts BorderRadius
      borderRadius: {
        card:      '12px',
        'card-lg': '16px',
        pill:      '9999px',
      },
      // Keep in sync with constants/spacing.ts Space
      spacing: {
        '3xs': '2px',
        '2xs': '4px',
        xs:    '6px',
        sm:    '10px',
        md:    '16px',
        lg:    '26px',
        xl:    '42px',
        '2xl': '68px',
        '3xl': '110px',
      },
      // Keep in sync with constants/theme.ts Typography
      fontFamily: {
        body:    ['System'],
        heading: ['System'],
      },
    },
  },
  plugins: [],
};
