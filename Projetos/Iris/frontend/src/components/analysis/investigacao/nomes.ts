import type { GrupoRegional, TipoAtor } from "../../../types/ator";
import type { Tema } from "../../../types/relacao";

export const NOME_TIPO_ATOR: Record<TipoAtor, string> = {
  estado: "País",
  organizacao: "Organização ou bloco",
  instituicao: "Instituição nacional",
  grupo: "Grupo ou setor",
};
export const NOME_GRUPO: Record<GrupoRegional, string> = {
  brasil: "Brasil (interno)",
  americas: "Américas",
  europa: "Europa",
  asia: "Ásia",
  multilateral: "Multilateral",
};
export const NOME_TEMA: Record<Tema, string> = {
  politica: "Política",
  economia: "Economia",
  seguranca: "Segurança",
  diplomacia: "Diplomacia",
  instituicoes: "Instituições",
};
