/** @type {import('tailwindcss').Config} */
export default {
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
            },
            borderRadius: {
                'soft': '2rem', // 32px - Modern standard
                'pill': '9999px',
            },
            boxShadow: {
                'soft': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 20px rgba(99, 102, 241, 0.3)', // Indigo glow
                'neumorphic': '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
            }
        },
    },
    plugins: [],
}
