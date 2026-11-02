// Entradas por tempo: linhas que sobem da máscara quando chegam na tela (e descem ao voltar),
// fotos que abrem de baixo para cima, com parallax leve dentro da moldura (esse sim preso ao scroll).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function entradas({ reduced }) {
  if (reduced) {
    gsap.set('.foto__moldura', { clipPath: 'inset(0% 0 0 0 round 22px)' });
    return;
  }
  document.querySelectorAll('.linhas').forEach((bloco) => {
    const linhas = bloco.querySelectorAll('.ln > span');
    gsap.set(linhas, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: bloco,
      start: 'top 88%',
      onEnter: () => gsap.to(linhas, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, overwrite: true }),
      onLeaveBack: () => gsap.to(linhas, { yPercent: 110, duration: 0.4, ease: 'power3.in', overwrite: true }),
    });
  });

  document.querySelectorAll('.foto').forEach((foto, i) => {
    const moldura = foto.querySelector('.foto__moldura');
    const img = moldura.querySelector('img');
    ScrollTrigger.create({
      trigger: foto,
      start: 'top 85%',
      onEnter: () => gsap.to(moldura, { clipPath: 'inset(0% 0 0 0 round 22px)', duration: 1.2, ease: 'expo.out', delay: i * 0.08 }),
      onLeaveBack: () => gsap.to(moldura, { clipPath: 'inset(100% 0 0 0 round 22px)', duration: 0.4, ease: 'power3.in' }),
    });
    gsap.fromTo(img, { yPercent: -9 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: foto, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // lado do formulário e itens da lista: entram juntos, um pouco depois do título
  gsap.utils.toArray('.itens li, .lista__sub, .lista__foto, .cartao, .contato__acoes, .contato__ks').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 28, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
  });
}
