import { Route, Routes } from "react-router-dom";
import { Layout } from "./componentes/Layout";
import { Vazio } from "./componentes/Estado";
import { Comparar } from "./paginas/Comparar";
import { Configuracoes } from "./paginas/Configuracoes";
import { Execucao } from "./paginas/Execucao";
import { Historico } from "./paginas/Historico";
import { Inicio } from "./paginas/Inicio";
import { NovaSimulacao } from "./paginas/NovaSimulacao";
import { Resultado } from "./paginas/Resultado";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="nova" element={<NovaSimulacao />} />
        <Route path="simulacoes/:id/execucao" element={<Execucao />} />
        <Route path="simulacoes/:id" element={<Resultado />} />
        <Route path="historico" element={<Historico />} />
        <Route path="comparar" element={<Comparar />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<Vazio titulo="Página não encontrada" />} />
      </Route>
    </Routes>
  );
}
