module.exports = {
  purge: ['./resources/**/*.{ts,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'base-yellow': '#f9dc06',
        // 'base-yellow': '#f7cd3e',
      },
      width: {
        '28': '7rem',
        '72': '18rem',
        '82': '21rem',
      },
      maxWidth: {
        '5': '5rem',
        '6': '6rem',
        '7': '7rem',
        '8': '8rem',
        '10': '10rem',
      },
      minWidth: {
        md: '768px',
      },
    },
    fontFamily: {
      sans: [
        '"Helvetica Neue"',
        'Arial',
        '"Hiragino Kaku Gothic ProN"',
        '"Hiragino Sans"',
        'Meiryo',
        'sans-serif',
      ],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
