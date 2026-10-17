/**
 * Ícones SVG em traço único (24×24, traço 2, pontas arredondadas — estilo Lucide).
 * Decorativos por padrão (aria-hidden); quem usa ícone sozinho dá nome ao botão.
 */
export type IconName =
  | 'copy'
  | 'check'
  | 'crown'
  | 'swords'
  | 'shield'
  | 'arrow-right'
  | 'plus'
  | 'minus'
  | 'fit'
  | 'route'
  | 'eye'
  | 'eye-off'
  | 'scroll'
  | 'users'
  | 'target'
  | 'close'
  | 'wifi-off'
  | 'chevron-up'
  | 'chevron-down'
  | 'door'
  | 'cards'
  | 'flag'
  | 'map'
  | 'info'
  | 'sword'
  | 'star';

const PATHS: Record<IconName, string> = {
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  check: 'M4 12l5 5L20 6',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z',
  swords: 'M14.5 17.5 3 6V3h3l11.5 11.5 M13 19l6-6 M16 16l4 4 M19 21l2-2 M9.5 17.5 21 6V3h-3L6.5 14.5 M11 19l-6-6 M8 16l-4 4 M5 21l-2-2',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  'arrow-right': 'M5 12h14 M13 6l6 6-6 6',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  fit: 'M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'eye-off': 'M3 3l18 18 M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9 M6.6 6.6C3.9 8.4 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 5.4-1.6 M9.9 9.9a3 3 0 0 0 4.2 4.2',
  scroll: 'M8 21h11a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v3h4 M19 17V5a2 2 0 0 0-2-2H4 M10 8h6 M10 12h6',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  close: 'M6 6l12 12 M18 6L6 18',
  'wifi-off': 'M2 2l20 20 M8.5 16.4a5 5 0 0 1 7 0 M5 12.9a10 10 0 0 1 5.2-2.8 M19 12.9a10 10 0 0 0-2.3-1.7 M2 8.8a15 15 0 0 1 4.2-2.6 M22 8.8A15 15 0 0 0 11 5 M12 20h.01',
  'chevron-up': 'M6 15l6-6 6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  door: 'M13 4h3a2 2 0 0 1 2 2v14 M2 20h20 M13 20V4L6 5.5V20 M10 12v.01',
  cards: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M9 7h6 M12 11l2 3-2 3-2-3z',
  flag: 'M4 22V4 M4 4h13l-2 4 2 4H4',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z M9 4v14 M15 6v14',
  sword: 'M14.5 17.5 3 6V3h3l11.5 11.5 M13 19l6-6 M16 16l4 4 M19 21l2-2',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01',
};

export function Icon({ name, size = 20, title }: { name: IconName; size?: number; title?: string }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}
