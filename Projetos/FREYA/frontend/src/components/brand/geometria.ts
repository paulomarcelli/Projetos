/**
 * Geometria da logo da F.R.E.Y.A., vetorizada de logo_raw1.jpeg (980×980).
 *
 * Cada estrela é uma estrela côncava de quatro pontas: quatro curvas cúbicas entre as pontas, com os
 * pontos de controle simétricos em relação à diagonal (P1 = (u·R, −v·R), P2 = (v·R, −u·R)). Os
 * parâmetros (centro, raio R, u, v) foram ajustados à silhueta do original e conferidos rasterizando
 * este SVG no Chromium a 980×980: IoU da silhueta = 0,991 (grande 0,993 · média 0,989 · pequena 0,980).
 *
 * O viewBox é o recorte justo das três estrelas (deslocamento de 147,75 × 159,5 px do original).
 */
export const VIEWBOX_LOGO = "0 0 686 659";
export const PROPORCAO_LOGO = 686 / 659;

export const ESTRELA_GRANDE =
  "M395 0C403.7 165.9 520.1 282.3 686 291C520.1 299.7 403.7 416.1 395 582C386.3 416.1 269.9 299.7 104 291C269.9 282.3 386.3 165.9 395 0Z";
export const ESTRELA_MEDIA =
  "M155 408C161.3 480.8 207.7 527.2 280.5 533.5C207.7 539.8 161.3 586.2 155 659C148.7 586.2 102.3 539.8 29.5 533.5C102.3 527.2 148.7 480.8 155 408Z";
export const ESTRELA_PEQUENA =
  "M35.5 361C37.6 380.9 51.1 394.4 71 396.5C51.1 398.6 37.6 412.1 35.5 432C33.4 412.1 19.9 398.6 0 396.5C19.9 394.4 33.4 380.9 35.5 361Z";

/** Centros (para transform-origin das animações), no sistema do viewBox. */
export const CENTRO_PEQUENA = { x: 35.5, y: 396.5 };
export const CENTRO_MEDIA = { x: 155, y: 533.5 };

/** Vetor do degradê, na mesma direção do original (do canto superior esquerdo para o inferior direito). */
export const DEGRADE_LOGO = { x1: 274, y1: 124.5, x2: 525, y2: 472.5 };
