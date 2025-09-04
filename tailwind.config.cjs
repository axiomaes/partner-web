/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  // Si tienes un tema 'lacubierta', defínelo aquí; si no, usa los por defecto
  // daisyui: { themes: ["light", "dark", "cupcake"] },
};
