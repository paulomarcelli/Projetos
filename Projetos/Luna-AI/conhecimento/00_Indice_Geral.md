# Luna RAG — índice geral da biblioteca

Esta biblioteca reúne uma curadoria científica, social e técnica para orientar conhecimento recuperável por uma futura aplicação de apoio emocional. É material educativo e de pesquisa: **não diagnostica, não prescreve, não substitui tratamento e não deve determinar decisões clínicas automaticamente**.

## Como navegar

Leia primeiro [README.md](README.md), [metodologia](01_Metodologia_de_Pesquisa.md), [política de qualidade das fontes](13_Politica_de_Qualidade_das_Fontes.md) e [taxonomia](taxonomia_conhecimento.json). Os capítulos temáticos contêm sínteses, referências e limitações junto dos achados. Os capítulos 12, 14 e 15 são especificações textuais para orientar decisões futuras, não implementações. O catálogo CSV é índice bibliográfico: use as fichas nos capítulos para metadados detalhados e distinção entre texto integral, resumo e acesso parcial.

## Arquivos e cobertura reportada

| Arquivo | Conteúdo | Encontradas | Verificadas | Textos integrais reportados |
|---|---|---:|---:|---:|
| `01_Metodologia_de_Pesquisa.md` | Bases, método, verificação e limitações agregadas | — | — | — |
| `02_Ansiedade_e_Ruminacao.md` | Ansiedade, preocupação, ruminação, regulação e enfrentamento | 21 | 21 | 14 |
| `03_Tristeza_e_Depressao.md` | Tristeza, depressão, fatores e intervenções | 16 | 12 | 5 |
| `04_Relacionamentos_e_Vinculos.md` | Apego, solidão, relações, violência e evidência | 13 | 13 | 0 |
| `05_Autoestima_e_Identidade.md` | Autocompaixão, identidade, comparação e redes sociais | 12 | 12 | 9 |
| `06_Estresse_Trabalho_e_Estudos.md` | Estresse, riscos ocupacionais, esgotamento e estudos | 22 | 22 | 20 |
| `07_Luto_e_Adversidades.md` | Luto, adversidade, adaptação, resiliência e apoio | 18 | 18 | 13 |
| `08_Tecnicas_Psicologicas.md` | Intervenções, contextos, limites e encaminhamento | 13 | 13 | 6 |
| `09_Fatores_Sociais_e_Culturais.md` | Determinantes sociais, desigualdade, cultura e acesso | 15 | 15 | 12 |
| `10_Habitos_e_Qualidade_de_Vida.md` | Sono, atividade física, alimentação, substâncias e suporte | 17 | 17 | 15 |
| `11_Crises_e_Seguranca.md` | Diretrizes para crises, suicídio, violência e encaminhamento | 24 | 20 | 16 |
| `12_Especificacao_Tecnica_RAG.md` | Ingestão, segmentação, recuperação, citações e segurança | 21 | 21 | 14 |
| `14_Avaliacao_e_Metricas_RAG.md` | Plano e métricas de avaliação de recuperação e respostas | 16 | 16 | 9 |
| `15_Governanca_e_Atualizacao.md` | Proveniência, atualização, direitos, privacidade e auditoria | 19 | 19 | 5 |

Os capítulos totalizam **227 candidatos encontrados**, **219 verificados** e **138 leituras integrais reportadas** (somatórios por capítulo, não obras únicas). O CSV deduplica exatamente por URL e contém **207 URLs distintas** entre as referências finais; URLs diferentes podem apontar ao mesmo trabalho. Consulte o [manifesto](manifesto_documentos.json) para a contabilização e hashes de arquivos.

## Principais conclusões, com cautela

Os capítulos indicam que intervenções psicológicas estudadas podem beneficiar grupos e condições delimitados, mas efeitos variam com população, intensidade, contexto e qualidade metodológica. Nenhuma técnica deve ser oferecida como solução universal. Sofrimento emocional também se relaciona a condições materiais, trabalho, discriminação, violência, vínculos, saúde e acesso a serviços; reduzir o problema a uma falha de pensamento individual distorce o escopo científico.

Diretrizes e sínteses não habilitam diagnóstico automatizado. Em risco iminente, violência, automutilação ou sofrimento grave, a prioridade é segurança e acesso a serviços humanos locais. Os capítulos de crise descrevem referências oficiais e encaminhamentos; confirme os contatos e procedimentos atuais antes de qualquer uso operacional.

Na futura recuperação, recomenda-se preservar origem e versão das evidências, recuperar documentos oficiais e científicos relevantes, citar as fontes realmente recuperadas e admitir falta de informação. Documentos externos devem ser tratados como dados não confiáveis, sem capacidade de alterar instruções de segurança. Validar a implementação com avaliação humana, métricas de recuperação e testes específicos de segurança é indispensável.

## Arquivos administrativos

- [Catálogo de fontes](catalogo_fontes.csv)
- [Taxonomia temática JSON](taxonomia_conhecimento.json)
- [Manifesto e hashes](manifesto_documentos.json)
- [Política de qualidade](13_Politica_de_Qualidade_das_Fontes.md)
- [Avaliação RAG](14_Avaliacao_e_Metricas_RAG.md)
- [Governança e atualização](15_Governanca_e_Atualizacao.md)
