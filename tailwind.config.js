/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Keep in sync with constants/theme.ts AppColors (re:sense design tokens)
      colors: {
        background:      '#F3EFE6',                // paper.50 (light surface)
        surface:         '#ECE5D9',                // paper.100
        elevated:        '#E3DACD',                // paper.200
        sand:            '#D9D2C3',                // sand.300
        border:          'rgba(13,13,16,0.12)',    // borderOnLight
        text:            '#0D0D10',                // ink.950
        'text-secondary': '#5C5C64',               // ink.500
        accent:          '#FFD03A',                // signal.500
        'accent-light':  'rgba(255,208,58,0.20)',
        'accent-deep':   '#E7B900',                // signal.600
        ink:             '#0D0D10',                // ink.950 (dark islands)
        'ink-elevated':  '#212125',                // ink.800
        premium:         '#7A7F5D',                // moss.500
        success:         '#4F6A56',                // status.success
        error:           '#A6453D',                // status.danger
      },
      // Keep in sync with constants/theme.ts BorderRadius
      borderRadius: {
        card:      '16px',
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
      // Keep in sync with constants/theme.ts Typography.fonts (re:sense brand fonts)
      fontFamily: {
        brand:   ['PlayfairDisplay', 'serif'],
        heading: ['Satoshi', 'system-ui', 'sans-serif'],
        body:    ['Satoshi', 'system-ui', 'sans-serif'],
        prompt:  ['SpecialElite', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
