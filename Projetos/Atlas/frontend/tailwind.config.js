/** Tokens do ATLAS: marinho, grafite, branco e azul-claro. Cores vêm de variáveis CSS (src/index.css). */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fundo: v("fundo"),
        painel: v("painel"),
        painel2: v("painel-2"),
        borda: v("borda"),
        texto: v("texto"),
        suave: v("suave"),
        acento: v("acento"),
        acentoHover: v("acento-hover"),
        sobreAcento: v("sobre-acento"),
        marca: v("marca"),
        baixo: v("baixo"),
        moderado: v("moderado"),
        alto: v("alto"),
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "Segoe UI", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
        serif: ['"IBM Plex Serif"', "Georgia", "Cambria", "serif"],
      },
      fontSize: { "2xs": ["0.6875rem", { lineHeight: "1rem" }] },
      // Curvas da skill animate (Emil Kowalski): forte ease-out para entradas, ease-in-out para movimento na tela.
      transitionTimingFunction: { out: "cubic-bezier(0.23, 1, 0.32, 1)", "in-out": "cubic-bezier(0.77, 0, 0.175, 1)" },
      keyframes: {
        entrar: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        aparecer: { from: { opacity: "0" }, to: { opacity: "1" } },
        pulso: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".35" } },
      },
      animation: {
        entrar: "entrar 240ms cubic-bezier(0.23, 1, 0.32, 1) both",
        aparecer: "aparecer 200ms ease both",
        pulso: "pulso 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
