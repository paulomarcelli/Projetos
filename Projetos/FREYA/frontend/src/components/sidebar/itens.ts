import { Bookmark, History, LayoutDashboard, Settings, type LucideIcon } from "lucide-react";
import { rotas } from "../../config/rotas";

export interface ItemDoMenu {
  para: string;
  rotulo: string;
  Icone: LucideIcon;
  /** Ativo só na rota exata (para "/"). */
  exato?: boolean;
}

export const ITENS_PRINCIPAIS: ItemDoMenu[] = [
  { para: rotas.inicio, rotulo: "Início", Icone: LayoutDashboard, exato: true },
  { para: rotas.historico, rotulo: "Histórico de análises", Icone: History },
  { para: rotas.guardados, rotulo: "Guardados", Icone: Bookmark },
];

export const ITENS_SECUNDARIOS: ItemDoMenu[] = [{ para: rotas.configuracoes, rotulo: "Configurações", Icone: Settings }];

/** Iniciais do perfil para o avatar: primeira letra do primeiro e do último nome. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1][0] ?? "") : "";
  return (primeira + ultima).toLocaleUpperCase("pt-BR");
}
