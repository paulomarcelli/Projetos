import pytest

from atlas import casos, motor
from atlas.modelos import SimulacaoEntrada


def sim(**valores):
    return SimulacaoEntrada(caso_id="eua-china-tarifas", valores=valores, horizonte_meses=12)


def test_valores_padrao_e_validacao(caso):
    v = motor.validar_valores(caso, {})
    assert v["tarifa"] == 30 and set(v) == {x.id for x in caso.variaveis}
    with pytest.raises(motor.ErroValidacao, match="não pertencem"):
        motor.validar_valores(caso, {"inexistente": 1})
    with pytest.raises(motor.ErroValidacao, match="entre"):
        motor.validar_valores(caso, {"tarifa": 500})
    with pytest.raises(motor.ErroValidacao):
        motor.validar_valores(caso, {"tarifa": float("nan")})


def test_indices_no_intervalo_e_faixas(caso):
    s = motor.executar(caso, sim())
    for ind in s.indices.values():
        assert 0 <= ind.valor <= 100
        assert ind.nivel == motor.nivel(ind.valor)
    assert motor.nivel(10) == "baixo" and motor.nivel(50) == "moderado" and motor.nivel(90) == "alto"


def test_monotonicidade(caso):
    baixo = motor.executar(caso, sim(tarifa=0, retaliacao=0))
    alto = motor.executar(caso, sim(tarifa=150, retaliacao=100))
    assert alto.indices["economico"].valor > baixo.indices["economico"].valor
    assert alto.propensao_escalada.valor > baixo.propensao_escalada.valor
    # engajamento diplomático reduz a propensão de escalada (efeito negativo)
    com_dialogo = motor.executar(caso, sim(diplomacia=100))
    sem_dialogo = motor.executar(caso, sim(diplomacia=0))
    assert com_dialogo.propensao_escalada.valor < sem_dialogo.propensao_escalada.valor


def test_extremos_e_horizonte(caso):
    tudo_max = {v.id: (v.maximo if v.efeito_escalada >= 0 else v.minimo) for v in caso.variaveis}
    s = motor.executar(caso, sim(**tudo_max))
    assert s.propensao_escalada.valor == 100
    curto = motor.executar(caso, SimulacaoEntrada(caso_id=caso.id, valores={}, horizonte_meses=3))
    longo = motor.executar(caso, SimulacaoEntrada(caso_id=caso.id, valores={}, horizonte_meses=24))
    assert longo.indices["economico"].valor > curto.indices["economico"].valor
    assert motor.fator_horizonte(60) == motor.fator_horizonte(24)


def test_contribuicoes_somam_indice(caso):
    s = motor.executar(caso, sim(tarifa=90))
    for ind in s.indices.values():
        assert abs(sum(ind.contribuicoes.values()) - ind.valor) < 0.6 or ind.valor == 100


def test_todos_os_casos_tem_variaveis_contextuais():
    for c in casos.listar():
        assert len(c.variaveis) >= 4 and len(c.atores) >= 4 and len(c.hipoteses) >= 2
        ids = [v.id for v in c.variaveis]
        assert len(ids) == len(set(ids))
        for v in c.variaveis:
            assert v.minimo <= v.padrao <= v.maximo
            assert set(v.pesos) <= {"economico", "diplomatico", "estrategico"}
        motor.executar(c, SimulacaoEntrada(caso_id=c.id, valores={}, horizonte_meses=12))


def test_descrever_variaveis_com_rotulos(caso):
    linhas = motor.descrever_variaveis(caso, motor.validar_valores(caso, {"retaliacao": 100}))
    assert any("assimétrica" in l for l in linhas)
