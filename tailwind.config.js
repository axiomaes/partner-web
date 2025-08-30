/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#111827",       // Negro ahumado (header)
          primaryDark: "#0b1220",   // Más oscuro para degradado
          cream: "#f8f5f2",         // Fondo cálido
          red: "#e11d48",           // Detalle “barbería”
          blue: "#2563eb",          // Detalle “barbería”
          gold: "#f59e0b",          // Acento premium
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
