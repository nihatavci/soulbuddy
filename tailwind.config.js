/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Keep in sync with constants/theme.ts AppColors (re:sense dark palette)
      colors: {
        background:      '#0E0F12',                // Obsidian
        surface:         '#16181D',                // Coal
        elevated:        '#1D2026',                // Surface Soft
        border:          'rgba(246,241,232,0.10)', // Divider
        text:            '#F6F1E8',                // Paper
        'text-secondary': '#B8B1A4',               // Warm Grey
        accent:          '#F2C94C',                // Signal Yellow
        'accent-light':  'rgba(242,201,76,0.14)',
        'accent-deep':   '#D9AB1F',                // Signal Yellow Deep
        premium:         '#69725F',                // Muted Olive
        success:         '#6E8F73',                // Soft Success
        error:           '#C85C5C',                // Soft Error
      },
      // Keep in sync with constants/theme.ts BorderRadius
      borderRadius: {
        card:      '20px',
        input:     '16px',
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
