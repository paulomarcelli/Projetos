import { Compass } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router";
import { EstadoVazio } from "../components/feedback/EstadoVazio";
import { LinhasEsqueleto } from "../components/ui/Carregando";
import { LayoutDoApp } from "../components/layout/LayoutDoApp";
import { ROTAS } from "../config/rotas";
import { PaginaAcervo } from "../pages/Configuracoes/PaginaAcervo";
import { PaginaConfiguracoes } from "../pages/Configuracoes/PaginaConfiguracoes";
import { PaginaSistemaDeDesign } from "../pages/SistemaDeDesign/PaginaSistemaDeDesign";
import { PaginaDocumento } from "../pages/Explorar/PaginaDocumento";
import { PaginaInicio } from "../pages/Inicio/PaginaInicio";
import { PaginaNovaComParametros } from "../pages/Inicio/PaginaNovaComParametros";
import { PaginaConversa } from "../pages/Conversa/PaginaConversa";
import { PaginaExplorar } from "../pages/Explorar/PaginaExplorar";
import { PaginaHistorico } from "../pages/Historico/PaginaHistorico";
import { PaginaFavoritos } from "../pages/Historico/PaginaFavoritos";

const PaginaAnalise = lazy(() => import("../pages/Analise/PaginaAnalise"));
const PaginaRelacoes = lazy(() => import("../pages/Relacoes/PaginaRelacoes"));

// Landing e telas de conta usam a biblioteca Motion: carregadas sob demanda, para que ela não
// pese no pacote da plataforma (/app), que anima só com CSS.
const PaginaLanding = lazy(() => import("../pages/Landing/PaginaLanding"));
const LayoutConta = lazy(() => import("../pages/Autenticacao/LayoutConta"));
const PaginaEntrar = lazy(() => import("../pages/Autenticacao/PaginaEntrar"));
const PaginaCriarConta = lazy(() => import("../pages/Autenticacao/PaginaCriarConta"));
const PaginaRecuperarSenha = lazy(() => import("../pages/Autenticacao/PaginaRecuperarSenha"));
const PaginaRedefinirSenha = lazy(() => import("../pages/Autenticacao/PaginaRedefinirSenha"));

/** Enquanto um pedaço carrega, só o fundo (sem esqueleto): a espera é curta e a página é de marca. */
const Fundo = () => <div className="min-h-dvh bg-abismo" />;

function NaoEncontrado() {
  return (
    <EstadoVazio
      icone={<Compass size={22} strokeWidth={1.5} aria-hidden="true" />}
      titulo="Esta página não existe"
      acao={
        <Link to={ROTAS.inicio} className="botao botao-secundario botao-pequeno">
          Voltar ao início
        </Link>
      }
    >
      O endereço pode estar errado ou o conteúdo foi movido.
    </EstadoVazio>
  );
}

/** Endereços antigos de documentos levam ao leitor de fontes. */
function RedirecionarDocumento() {
  const { id = "" } = useParams();
  return <Navigate to={ROTAS.fonte(id)} replace />;
}

function Plataforma() {
  return (
    <LayoutDoApp>
      <Routes>
        <Route index element={<PaginaInicio />} />
        <Route path="conversas/:id" element={<PaginaConversa />} />
        <Route path="nova" element={<PaginaNovaComParametros />} />
        <Route path="investigacoes" element={<PaginaHistorico />} />
        <Route
          path="investigacoes/:id"
          element={
            <Suspense fallback={<LinhasEsqueleto linhas={6} />}>
              <PaginaAnalise />
            </Suspense>
          }
        />
        <Route
          path="relacoes/:id?"
          element={
            <Suspense fallback={<LinhasEsqueleto linhas={6} />}>
              <PaginaRelacoes />
            </Suspense>
          }
        />
        <Route path="base-cientifica" element={<PaginaExplorar />} />
        <Route path="base-cientifica/:id" element={<PaginaDocumento />} />
        {/* Mapa, cenários e sinais vivem dentro de cada investigação; os endereços antigos levam até lá. */}
        <Route path="mapas" element={<Navigate to={ROTAS.relacoes} replace />} />
        <Route path="cenarios" element={<Navigate to={ROTAS.investigacoes} replace />} />
        <Route path="sinais" element={<Navigate to={ROTAS.investigacoes} replace />} />
        <Route path="favoritos" element={<PaginaFavoritos />} />
        <Route path="configuracoes" element={<PaginaConfiguracoes />} />
        <Route path="configuracoes/acervo" element={<PaginaAcervo />} />
        <Route path="configuracoes/acervo/:id" element={<PaginaDocumento gestao />} />
        <Route path="design-system" element={<PaginaSistemaDeDesign />} />
        <Route path="*" element={<NaoEncontrado />} />
      </Routes>
    </LayoutDoApp>
  );
}

/** Todas as rotas do app: landing, telas de conta e a plataforma (/app). */
export function Rotas() {
  return (
    <Routes>
      <Route
        path={ROTAS.landing}
        element={
          <Suspense fallback={<Fundo />}>
            <PaginaLanding />
          </Suspense>
        }
      />
      {/* Entrar é uma página inteira (a sign-in page tem as suas duas colunas, com a imagem). */}
      <Route
        path={ROTAS.entrar}
        element={
          <Suspense fallback={<Fundo />}>
            <PaginaEntrar />
          </Suspense>
        }
      />
      {/* As outras telas de conta: rota-pai com a moldura comum; só o formulário troca (com transição). */}
      <Route
        element={
          <Suspense fallback={<Fundo />}>
            <LayoutConta />
          </Suspense>
        }
      >
        <Route path={ROTAS.criarConta} element={<PaginaCriarConta />} />
        <Route path={ROTAS.recuperarSenha} element={<PaginaRecuperarSenha />} />
        <Route path={ROTAS.redefinirSenha} element={<PaginaRedefinirSenha />} />
      </Route>
      <Route path="/app/*" element={<Plataforma />} />
      <Route path="/documentos" element={<Navigate to={ROTAS.acervo} replace />} />
      <Route path="/documentos/:id" element={<RedirecionarDocumento />} />
      <Route path="*" element={<Navigate to={ROTAS.landing} replace />} />
    </Routes>
  );
}
