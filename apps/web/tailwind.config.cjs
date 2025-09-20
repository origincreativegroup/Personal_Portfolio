module.exports = {
  content: ['src/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#5a3cf4',
        highlight: '#cbc0ff',
        charcoal: {
          900: '#1a1a1a',
          700: '#333333',
        },
      },
      borderRadius: {
        xl: '1.5rem',
      },
    },
    fontFamily: {
      sans: ["'Inter'", 'system-ui', 'sans-serif'],
    },
  },
  plugins: [],
};
