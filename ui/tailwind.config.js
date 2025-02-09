/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@radix-ui/themes/**/*.{js,ts,jsx,tsx}", // Add this for Radix Themes
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
