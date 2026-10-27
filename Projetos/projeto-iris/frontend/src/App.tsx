import { Compass } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router";
import { EstadoVazio, LinhasEsqueleto } from "./components/Estados";
import { Shell } from "./components/Shell";
import { AlternadorDados } from "./dev/AlternadorDados";
import { PREVIA } from "./lib/api";
import { ROTAS } from "./lib/rotas";
import { Acervo } from "./pages/Acervo";
import { Configuracoes } from "./pages/Configuracoes";
import { DesignSystem } from "./pages/DesignSystem";
import { DocumentoDetalhe } from "./pages/DocumentoDetalhe";
import { Entrar } from "./pages/Entrar";
import { Inicio } from "./pages/Inicio";
import { Landing } from "./pages/Landing";
import { BaseCientifica, Cenarios, Favoritos, Investigacoes, MapasRelacoes, Sinais } from "./pages/Modulos";

const PaginaDaInvestigacao = lazy(() => import("./pages/ResultadoInvestigacao"));

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
    <Shell>
      <Routes>
        <Route index element={<Inicio />} />
        <Route path="investigacoes" element={<Investigacoes />} />
        <Route
          path="investigacoes/:id"
          element={
            <Suspense fallback={<LinhasEsqueleto linhas={6} />}>
              <PaginaDaInvestigacao />
            </Suspense>
          }
        />
        <Route path="base-cientifica" element={<BaseCientifica />} />
        <Route path="base-cientifica/:id" element={<DocumentoDetalhe />} />
        <Route path="mapas" element={<MapasRelacoes />} />
        <Route path="cenarios" element={<Cenarios />} />
        <Route path="sinais" element={<Sinais />} />
        <Route path="favoritos" element={<Favoritos />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="configuracoes/acervo" element={<Acervo />} />
        <Route path="configuracoes/acervo/:id" element={<DocumentoDetalhe gestao />} />
        <Route path="design-system" element={<DesignSystem />} />
        <Route path="*" element={<NaoEncontrado />} />
      </Routes>
    </Shell>
  );
}

export function App() {
  return (
    <>
      {/* Selo da prévia no fluxo da página (e não fixo): nunca cobre conteúdo, links ou fontes. */}
      {PREVIA && (
        <p role="note" className="border-b border-ambar/30 bg-ambar-suave px-4 py-1.5 text-center text-micro text-ambar">
          Prévia estática · dados de exemplo · envio e remoção desativados
        </p>
      )}
      <Routes>
        <Route path={ROTAS.landing} element={<Landing />} />
        <Route path={ROTAS.entrar} element={<Entrar />} />
        <Route path="/app/*" element={<Plataforma />} />
        <Route path="/documentos" element={<Navigate to={ROTAS.acervo} replace />} />
        <Route path="/documentos/:id" element={<RedirecionarDocumento />} />
        <Route path="*" element={<Navigate to={ROTAS.landing} replace />} />
      </Routes>
      {import.meta.env.DEV && !PREVIA && <AlternadorDados />}
    </>
  );
}
