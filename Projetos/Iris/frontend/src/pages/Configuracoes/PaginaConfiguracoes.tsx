import { ArrowRight, FolderInput, RotateCw } from "lucide-react";
import { Link } from "react-router";
import { ErroDeCarregamento } from "../../components/feedback/ErroDeCarregamento";
import { LinhasEsqueleto } from "../../components/ui/Carregando";
import { Origem } from "../../components/ui/Origem";
import { Secao } from "../../components/ui/Secao";
import { SeletorTamanhoTexto, SeletorTema } from "../../components/ui/SeletorTema";
import { CabecalhoDePagina } from "../../components/layout/CabecalhoDePagina";
import { prontidao } from "../../services/api";
import { MARCA } from "../../config/marca";
import { useDados } from "../../hooks/useDados";
import { ROTAS } from "../../config/rotas";

const NOMES: Record<string, string> = {
  database: "Banco de dados (PostgreSQL)",
  pgvector: "Extensão pgvector",
  llm: "Modelo de linguagem (opcional)",
};

const ESTADOS: Record<string, { texto: string; cor: string }> = {
  ok: { texto: "Operacional", cor: "var(--color-positivo)" },
  configured: { texto: "Configurado", cor: "var(--color-positivo)" },
  unavailable: { texto: "Indisponível", cor: "var(--color-negativo)" },
  missing: { texto: "Ausente: rode as migrações", cor: "var(--color-negativo)" },
  not_configured: { texto: "Não configurado", cor: "var(--color-texto-3)" },
  previa: { texto: "Não conectado (prévia estática)", cor: "var(--color-texto-2)" },
  unknown: { texto: "Desconhecido", cor: "var(--color-texto-3)" },
};

export function PaginaConfiguracoes() {
  const estado = useDados(prontidao, []);
  return (
    <div>
      <CabecalhoDePagina rotulo="Pessoal" titulo="Configurações">
        Administração do acervo, estado do sistema, aparência e referência da identidade visual.
      </CabecalhoDePagina>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <section aria-labelledby="titulo-acervo-cfg" className="painel flex flex-col items-start gap-3 p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <FolderInput size={20} strokeWidth={1.6} aria-hidden="true" className="text-ciano" />
            <h2 id="titulo-acervo-cfg" className="font-editorial text-secao text-texto">
              Gestão do acervo
            </h2>
          </div>
          <p className="max-w-[65ch] text-corpo text-texto-2">
            Envie PDFs científicos para a base, acompanhe o processamento e remova documentos. É a área
            de administração: quem pesquisa consulta as fontes na Base científica.
          </p>
          <Link to={ROTAS.acervo} className="botao botao-secundario botao-pequeno">
            Abrir a gestão do acervo
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </section>
        <Secao
          id="titulo-sistema"
          titulo="Estado do sistema"
          acao={
            <button type="button" className="botao botao-secundario botao-pequeno" onClick={estado.recarregar}>
              <RotateCw size={14} aria-hidden="true" />
              Verificar
            </button>
          }
        >
          {estado.tipo === "carregando" ? (
            <LinhasEsqueleto linhas={3} />
          ) : estado.tipo === "erro" ? (
            <ErroDeCarregamento erro={estado.erro} aoTentarDeNovo={estado.recarregar} />
          ) : (
            <div className="flex flex-col gap-3">
              <dl className="m-0">
                {Object.entries({ ...estado.dados.checks, ...(estado.dados.optional ?? {}) }).map(([k, v]) => {
                  const e = ESTADOS[v] ?? { texto: v, cor: "var(--color-texto-3)" };
                  return (
                    <div key={k} className="flex items-center justify-between gap-4 border-b border-linha py-3">
                      <dt className="text-corpo text-texto">{NOMES[k] ?? k}</dt>
                      <dd className="m-0 flex items-center gap-2 text-legenda text-texto-2">
                        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                          <circle cx="4" cy="4" r="3.5" fill={e.cor} />
                        </svg>
                        {e.texto}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              <Origem>GET /health/ready</Origem>
            </div>
          )}
        </Secao>

        <Secao id="titulo-aparencia" titulo="Aparência">
          {/* Tema e tamanho do texto valem na hora, em todas as páginas, e ficam salvos neste
              navegador (store/preferencias.ts). */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h3 className="text-corpo font-medium text-texto">Tema</h3>
              <p className="max-w-[60ch] text-corpo text-texto-2">
                O claro é melhor para leitura longa em ambiente iluminado; o escuro, para pouca luz. Sem escolha, a Iris
                segue o sistema. A impressão e o PDF saem sempre no tema claro.
              </p>
              <SeletorTema />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-corpo font-medium text-texto">Tamanho do texto</h3>
              <p className="max-w-[60ch] text-corpo text-texto-2">
                Aumenta textos e títulos em toda a plataforma. Ícones, mapas e gráficos mantêm o tamanho, para não
                perder a proporção.
              </p>
              <SeletorTamanhoTexto />
            </div>
          </div>
        </Secao>

        <Secao id="titulo-sobre" titulo="Sobre">
          <div className="flex flex-col gap-4 text-corpo text-texto-2">
            <p className="font-editorial text-leitura text-texto">{MARCA.conceito}</p>
            <p>
              Esta versão recebe documentos científicos e extrai o texto por página. Investigações,
              cenários, sinais e mapas de relações dependem das próximas fases e aparecem como estados
              vazios até lá.
            </p>
            <p className="text-legenda">
              Sem autenticação: use apenas em ambiente de desenvolvimento controlado. Rascunhos e
              favoritos ficam só neste navegador.
            </p>
            <Link to={ROTAS.designSystem} className="inline-flex w-fit items-center gap-1 text-ciano-texto hover:underline">
              Ver o design system
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </Secao>
      </div>
    </div>
  );
}
