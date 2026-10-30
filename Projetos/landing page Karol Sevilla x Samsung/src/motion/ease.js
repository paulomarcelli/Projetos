// As curvas do site, num lugar só (as mesmas de tokens.css).
//   out  entradas: rápida no começo e longa no pouso (expo.out)
//   in   saídas: segura e acelera (power3.in), sempre mais curta que a entrada
//   io   deslocamentos grandes que começam e terminam parados (seletor, peças do gimbal)
export const EASE = {
  out: 'expo.out',
  in: 'power3.in',
  io: 'expo.inOut',
};
