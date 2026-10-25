"""Infraestrutura comum aos agentes: contexto de execução, orçamento de chamadas e cache."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

from ..config import Config
from ..modelos import Caso, NomeAgente, SaidaMotor, SimulacaoEntrada, Uso
from ..persistencia import Banco
from ..provedores.busca import ProvedorBusca
from ..provedores.erros import ErroProvedor
from ..provedores.llm import ProvedorLLM

Emissor = Callable[[NomeAgente, str, str, dict], Awaitable[None]]


@dataclass
class Contexto:
    cfg: Config
    banco: Banco
    llm: ProvedorLLM
    busca: ProvedorBusca
    caso: Caso
    entrada: SimulacaoEntrada
    motor: SaidaMotor
    condicoes: list[str]
    emitir: Emissor
    uso: Uso = field(default_factory=Uso)

    async def chamar_llm(self, agente: NomeAgente, tarefa: str, sistema: str, usuario: str, contexto: dict[str, Any], usar_cache: bool = True) -> dict[str, Any]:
        """Chamada de IA com teto por simulação e cache de prompts idênticos.

        Rodadas de revisão passam usar_cache=False: repetir a mesma resposta não corrigiria nada."""
        chave = self.banco.chave("llm", self.llm.nome, tarefa, sistema, usuario)
        if self.llm.nome != "demo" and usar_cache:
            em_cache = self.banco.cache_ler(chave, self.cfg.cache_horas * 3600)
            if isinstance(em_cache, dict):
                self.uso.cache_hits += 1
                await self.emitir(agente, "progresso", "Resposta reaproveitada do cache (mesmo pedido já analisado).", {"tarefa": tarefa})
                return em_cache
        if self.llm.nome != "demo":
            if self.uso.chamadas_llm >= self.cfg.max_chamadas_llm:
                raise ErroProvedor("limite_local", f"Limite de {self.cfg.max_chamadas_llm} chamadas de IA por simulação atingido.")
        resp = await self.llm.gerar_json(tarefa, sistema, usuario, contexto)
        if self.llm.nome != "demo":
            self.uso.chamadas_llm += 1
            self.uso.tokens_entrada += resp.tokens_entrada
            self.uso.tokens_saida += resp.tokens_saida
            self.banco.somar_uso(chamadas_llm=1, tokens=resp.tokens_entrada + resp.tokens_saida)
            self.banco.cache_gravar(chave, resp.dados)
        return resp.dados


    def esquecer(self, tarefa: str, sistema: str, usuario: str) -> None:
        """Remove do cache uma resposta que se mostrou inválida, para não reaproveitá-la."""
        self.banco.cache_apagar(self.banco.chave("llm", self.llm.nome, tarefa, sistema, usuario))


def json_compacto(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), default=str)
