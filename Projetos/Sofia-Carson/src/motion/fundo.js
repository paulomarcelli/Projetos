// O filme do fundo: toca mudo em loop; pausa com a aba escondida; com movimento reduzido fica no pôster.
import { reduzido } from './rolagem.js';

export function fundo() {
  const video = document.querySelector('[data-fundo] video');
  if (reduzido()) { video.removeAttribute('src'); video.load(); return Promise.resolve(); }
  const toca = () => video.play().catch(() => {});
  document.addEventListener('visibilitychange', () => (document.hidden ? video.pause() : toca()));
  toca();
  // pronto quando dá para tocar até o fim sem travar (ou 3,5 s, o que vier antes)
  return new Promise(ok => {
    if (video.readyState >= 4) return ok();
    video.addEventListener('canplaythrough', ok, { once: true });
    setTimeout(ok, 3500);
  });
}
