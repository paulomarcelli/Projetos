import { Button } from '../components/ui/Button';
import { setState } from '../net/store';

/** (1) Tela inicial com a identidade de Nárnia: a própria arte do mapa ao fundo. */
export function HomeScreen() {
  return (
    <div className="home">
      <div className="home__art" aria-hidden="true" />
      <main className="home__content" id="conteudo">
        <p className="home__eyebrow">Estratégia multiplayer · 2 a 6 jogadores</p>
        <h1 className="home__title">
          <span className="home__war">WAR</span>
          <span className="home__sub">As Crônicas de Nárnia</span>
        </h1>
        <p className="home__lead">
          Conquiste os seis reinos — de Cair Paravel às Ilhas Orientais. Reforce, ataque e cumpra seu objetivo secreto antes dos outros.
        </p>
        <div className="home__actions">
          <Button variant="primary" icon="swords" onClick={() => setState({ screen: 'menu' })} className="btn--lg">
            Jogar
          </Button>
        </div>
        <ul className="home__features" aria-label="Como funciona">
          <li>
            <strong>42 territórios</strong> em 6 regiões, do mapa ilustrado de Nárnia.
          </li>
          <li>
            <strong>Partidas online</strong> com link de convite — cada um no seu navegador.
          </li>
          <li>
            <strong>Pode fechar a aba:</strong> a partida fica salva e você volta de onde parou.
          </li>
        </ul>
      </main>
    </div>
  );
}
