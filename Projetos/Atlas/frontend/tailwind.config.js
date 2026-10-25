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
        acentoForte: v("acento-forte"),
        baixo: v("baixo"),
        moderado: v("moderado"),
        alto: v("alto"),
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "Segoe UI", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: { "2xs": ["0.6875rem", { lineHeight: "1rem" }] },
      keyframes: {
        entrar: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        pulso: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".35" } },
      },
      animation: { entrar: "entrar 320ms cubic-bezier(.2,.8,.2,1) both", pulso: "pulso 1.4s ease-in-out infinite" },
    },
  },
  plugins: [],
};
