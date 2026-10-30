// Entrada: só o CSS e a tela de carga (pequena, sem three nem gsap). O resto do site (o 3D e todo o motion) é um
// pedaço à parte que a carga baixa contando os bytes e só então importa.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/geist-mono';

import './styles/tokens.css';
import './styles/base.css';
import './styles/secoes.css';

import { carga } from './motion/loader.js';

history.scrollRestoration = 'manual';
scrollTo(0, 0);
carga.load(() => import('./app.js'));
