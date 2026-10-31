import { useParams } from "react-router";
import { Conversa } from "../../components/analysis/conversa/Conversa";

/** Uma conversa do histórico (`/app/conversas/:id`). */
export function PaginaConversa() {
  const { id = "" } = useParams();
  return <Conversa key={id} id={id} />;
}
