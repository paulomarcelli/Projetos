// Ícones simples para os cartões (traço grosso, cores chapadas).
const T = "#1a1a1a";

export const IconeLua: React.FC<{ riscado?: boolean }> = ({ riscado }) => (
  <svg width={84} height={84} viewBox="0 0 84 84">
    <circle cx={42} cy={42} r={30} fill="#f3efe0" stroke={T} strokeWidth={5} />
    <circle cx={32} cy={34} r={6} fill="#cfc8b0" />
    <circle cx={52} cy={50} r={8} fill="#cfc8b0" />
    {riscado ? <line x1={12} y1={72} x2={72} y2={12} stroke="#e5383b" strokeWidth={9} strokeLinecap="round" /> : null}
  </svg>
);

export const IconeOnda: React.FC = () => (
  <svg width={84} height={84} viewBox="0 0 84 84">
    {[30, 50].map((y) => (
      <path key={y} d={`M 8 ${y} q 11 -12 22 0 t 22 0 t 22 0`} fill="none" stroke="#2a6fc0" strokeWidth={8} strokeLinecap="round" />
    ))}
    <path d="M 8 70 L 76 70" stroke={T} strokeWidth={5} strokeLinecap="round" />
  </svg>
);

export const IconeSol: React.FC = () => (
  <svg width={84} height={84} viewBox="0 0 84 84">
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return <line key={i} x1={42 + Math.cos(a) * 26} y1={42 + Math.sin(a) * 26} x2={42 + Math.cos(a) * 38} y2={42 + Math.sin(a) * 38} stroke="#ff9a1f" strokeWidth={6} strokeLinecap="round" />;
    })}
    <circle cx={42} cy={42} r={18} fill="#ffd21f" stroke={T} strokeWidth={5} />
  </svg>
);

export const IconeNeve: React.FC = () => (
  <svg width={84} height={84} viewBox="0 0 84 84">
    {[0, 1, 2].map((i) => {
      const a = (i * Math.PI) / 3;
      return <line key={i} x1={42 - Math.cos(a) * 32} y1={42 - Math.sin(a) * 32} x2={42 + Math.cos(a) * 32} y2={42 + Math.sin(a) * 32} stroke="#4fa3f7" strokeWidth={8} strokeLinecap="round" />;
    })}
    <circle cx={42} cy={42} r={7} fill="#fff" stroke={T} strokeWidth={4} />
  </svg>
);

export const IconeOvo: React.FC = () => (
  <svg width={84} height={84} viewBox="0 0 84 84">
    {[
      [30, 50],
      [50, 36],
      [54, 60],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={11} fill="#ffd0e4" stroke={T} strokeWidth={4} />
    ))}
  </svg>
);
