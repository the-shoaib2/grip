/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./devtools.html",
    "./src/**/*.{html,tsx,ts}",
    "../../packages/devtools/src/**/*.{html,tsx,ts}",
  ],
  theme: { extend: {} },
  plugins: [],
};
