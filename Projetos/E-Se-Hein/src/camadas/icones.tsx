import { medidas, rotulo } from "../mundo/paleta";

// Ícones do Design System: 168 × 168, amarelos com contorno tinta de 8 px. Só dentro do Cartão.
const L = medidas["rotulo/cartao/icone"];
const A = rotulo.amarelo;
const T = rotulo.contorno;
const traco = { stroke: T, strokeWidth: 8, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const Icone: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={L} height={L} viewBox="0 0 168 168">
    {children}
  </svg>
);

const crateras = (
  <>
    <circle cx={66} cy={66} r={13} fill="none" {...traco} />
    <circle cx={104} cy={98} r={17} fill="none" {...traco} />
    <circle cx={70} cy={112} r={8} fill="none" {...traco} />
  </>
);

export const IconeLua: React.FC = () => (
  <Icone>
    <circle cx={84} cy={84} r={62} fill={A} {...traco} />
    {crateras}
  </Icone>
);

export const IconeLuaRiscada: React.FC = () => (
  <Icone>
    <circle cx={84} cy={84} r={62} fill={A} {...traco} />
    {crateras}
    <line x1={26} y1={142} x2={142} y2={26} stroke={T} strokeWidth={26} strokeLinecap="round" />
    <line x1={26} y1={142} x2={142} y2={26} stroke={rotulo.vermelho} strokeWidth={12} strokeLinecap="round" />
  </Icone>
);

const onda = (y: number) => `M 22 ${y} q 15.5 -16 31 0 t 31 0 t 31 0 t 31 0`;

export const IconeMareAlta: React.FC = () => (
  <Icone>
    <path d={`${onda(56)} L 146 146 L 22 146 Z`} fill={A} {...traco} />
    <line x1={84} y1={14} x2={84} y2={32} {...traco} />
  </Icone>
);

export const IconeMareBaixa: React.FC = () => (
  <Icone>
    <line x1={22} y1={56} x2={146} y2={56} stroke={T} strokeWidth={8} strokeDasharray="2 14" strokeLinecap="round" />
    <path d={`${onda(112)} L 146 146 L 22 146 Z`} fill={A} {...traco} />
  </Icone>
);

export const IconeSol: React.FC = () => (
  <Icone>
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return <line key={i} x1={84 + Math.cos(a) * 52} y1={84 + Math.sin(a) * 52} x2={84 + Math.cos(a) * 74} y2={84 + Math.sin(a) * 74} {...traco} strokeWidth={10} />;
    })}
    <circle cx={84} cy={84} r={40} fill={A} {...traco} />
  </Icone>
);

export const IconeFloco: React.FC = () => (
  <Icone>
    {[0, 1, 2].map((i) => {
      const a = (i * Math.PI) / 3 + Math.PI / 2;
      const x = Math.cos(a) * 66;
      const y = Math.sin(a) * 66;
      return (
        <g key={i}>
          <line x1={84 - x} y1={84 - y} x2={84 + x} y2={84 + y} stroke={T} strokeWidth={26} strokeLinecap="round" />
          <line x1={84 - x} y1={84 - y} x2={84 + x} y2={84 + y} stroke={A} strokeWidth={12} strokeLinecap="round" />
        </g>
      );
    })}
  </Icone>
);

export const IconeTerra: React.FC = () => (
  <Icone>
    <circle cx={84} cy={84} r={62} fill={A} {...traco} />
    <path d="M 50 60 l 22 -8 l 12 16 l -10 18 l -20 -4 Z M 96 100 l 22 -6 l 6 20 l -18 12 Z" fill="none" {...traco} />
  </Icone>
);

export const IconeCaranguejo: React.FC = () => (
  <Icone>
    <ellipse cx={84} cy={100} rx={46} ry={28} fill={A} {...traco} />
    <circle cx={34} cy={60} r={16} fill={A} {...traco} />
    <circle cx={134} cy={60} r={16} fill={A} {...traco} />
  </Icone>
);

export const IconeCoral: React.FC = () => (
  <Icone>
    <path d="M 84 150 L 84 96 L 52 56 M 84 96 L 116 50 M 84 120 L 120 98" fill="none" stroke={T} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 84 150 L 84 96 L 52 56 M 84 96 L 116 50 M 84 120 L 120 98" fill="none" stroke={A} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
  </Icone>
);
