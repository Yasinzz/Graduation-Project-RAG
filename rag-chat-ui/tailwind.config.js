/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        animation: {
          'blink': 'blink 1s step-end infinite',
        },
        keyframes: {
          blink: {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0' },
          }
        }
      },
    },
    plugins: [
      // 如果之后报错说找不到 typography，可以把下面这行先注释掉
      require('@tailwindcss/typography'), 
    ],
  }