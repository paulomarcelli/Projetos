import { Compass } from "lucide-react";
import { Link, Route, Routes } from "react-router";
import { EstadoVazio } from "./components/Estados";
import { Shell } from "./components/Shell";
import { AlternadorDados } from "./dev/AlternadorDados";
import { Configuracoes } from "./pages/Configuracoes";
import { DesignSystem } from "./pages/DesignSystem";
import { DocumentoDetalhe } from "./pages/DocumentoDetalhe";
import { Documentos } from "./pages/Documentos";
import { Inicio } from "./pages/Inicio";
import { BaseCientifica, Cenarios, Favoritos, Investigacoes, MapasRelacoes, Sinais } from "./pages/Modulos";

function NaoEncontrado() {
  return (
    <EstadoVazio
      icone={<Compass size={22} strokeWidth={1.5} aria-hidden="true" />}
      titulo="Esta página não existe"
      acao={
        <Link to="/" className="botao botao-secundario botao-pequeno">
          Voltar ao início
        </Link>
      }
    >
      O endereço pode estar errado ou o conteúdo foi movido.
    </EstadoVazio>
  );
}

export function App() {
  return (
    <>
      <Shell>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/investigacoes" element={<Investigacoes />} />
          <Route path="/base-cientifica" element={<BaseCientifica />} />
          <Route path="/mapas" element={<MapasRelacoes />} />
          <Route path="/cenarios" element={<Cenarios />} />
          <Route path="/sinais" element={<Sinais />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/documentos/:id" element={<DocumentoDetalhe />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/design-system" element={<DesignSystem />} />
          <Route path="*" element={<NaoEncontrado />} />
        </Routes>
      </Shell>
      {import.meta.env.DEV && <AlternadorDados />}
    </>
  );
}
