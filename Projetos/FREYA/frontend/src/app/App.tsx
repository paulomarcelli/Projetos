import { RouterProvider } from "react-router";
import { ProvedorDePreferencias } from "../contexts/Preferencias";
import { roteador } from "./roteador";

export function App() {
  return (
    <ProvedorDePreferencias>
      <RouterProvider router={roteador} />
    </ProvedorDePreferencias>
  );
}
