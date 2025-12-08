/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                background: '#F2F4F8', // Cool grey-white for better contrast with pure white cards
                surface: '#FFFFFF',
                neu: {
                    base: '#eef2f6',
                    'base-dark': '#262a33',
                    white: '#ffffff',
                    shadow: '#d1d9e6',
                    'shadow-dark': '#1a1d23',
                    'light-dark': '#323743'
                },
                brand: {
                    500: '#6d5dfc',
                    600: '#5b4bc4',
                }
            },
            borderRadius: {
                'soft': '2rem', // 32px - Modern standard
                'pill': '9999px',
            },
            boxShadow: {
                'soft': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 20px rgba(99, 102, 241, 0.3)', // Indigo glow
                'neumorphic': '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
                'neu': '9px 9px 16px rgb(209, 217, 230, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
                'neu-pressed': 'inset 6px 6px 10px 0 rgba(209, 217, 230, 0.8), inset -6px -6px 10px 0 rgba(255, 255, 255, 0.8)',
                'neu-sm': '5px 5px 10px rgb(209, 217, 230, 0.6), -5px -5px 10px rgba(255, 255, 255, 0.5)',
                'neu-dark': '9px 9px 16px rgb(26, 29, 35, 0.6), -9px -9px 16px rgba(50, 55, 67, 0.5)',
                'neu-dark-pressed': 'inset 6px 6px 10px 0 rgba(26, 29, 35, 0.8), inset -6px -6px 10px 0 rgba(50, 55, 67, 0.5)',
                'neu-up': '0 -5px 15px rgb(209, 217, 230, 0.6), 0 -5px 15px rgba(255, 255, 255, 0.5)',
                'neu-up-dark': '0 -5px 15px rgb(26, 29, 35, 0.6), 0 -5px 15px rgba(50, 55, 67, 0.5)',
            }
        },
    },
    plugins: [],
}
