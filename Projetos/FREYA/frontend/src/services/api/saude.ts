import type { Saude } from "../../types/api";
import { requisitar } from "./cliente";

/** GET /saude — motor, modelo e tamanho da base. */
export async function obterSaude(sinal?: AbortSignal): Promise<Saude> {
  return requisitar<Saude>("/saude", { sinal });
}
