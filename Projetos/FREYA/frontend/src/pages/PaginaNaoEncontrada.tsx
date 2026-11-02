import { Compass, House } from "lucide-react";
import { BotaoLink, EstadoVazio } from "../components/ui";
import { rotas } from "../config/rotas";

export function PaginaNaoEncontrada() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="sr-only">Página não encontrada</h1>
        <EstadoVazio
          icone={<Compass />}
          titulo="Esta página não existe nesta linha do tempo"
          texto="O endereço pode estar incompleto, ou a página mudou de lugar."
          acao={
            <BotaoLink to={rotas.inicio} variante="primario" icone={<House />}>
              Voltar ao início
            </BotaoLink>
          }
        />
      </div>
    </div>
  );
}
