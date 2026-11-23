# Defesa do TCC III · Slides

Apresentação web da defesa do TCC III de **Diego Fonseca da Silva** (Ciência da Computação, UNIVALI, novembro de 2026):
*Orquestração de um Pipeline End-to-End de Dados Geoespaciais sobre Unidades de Conservação em Santa Catarina*.

HTML, CSS e JavaScript puros, sem dependências nem etapa de build.

## Rotas

| Rota | Conteúdo |
|---|---|
| `/` | 19 slides da apresentação (cerca de 25 min) |
| `/apresentador/` | Uso do apresentador: roteiro de fala, cronômetro, próximo slide, slides de apoio para a arguição e sincronização com a tela do público |

## Funcionalidades

- Prancheta 16:9 (1920×1080) escalada para qualquer tela, sem distorção nem corte.
- Menu lateral clicável (tecla `M`), sumário clicável (slide 2 e botão "Sumário" em cada slide), visão geral em miniaturas (`G`).
- Figuras clicáveis em tela cheia, com zoom (roda do mouse, `+`/`−`, duplo clique), arraste e saída por `Esc` ou `✕`.
- Teclado (`←` `→` `Espaço` `PgUp` `PgDn` `Home` `End`, número + `Enter`), toque (deslizar) e URL por slide (`#/7`).
- Tela cheia (`F`), ajuda (`?`) e impressão/PDF com um slide por página (botão de impressora).
- Apresentador: abre a tela do público (`O`) e as duas janelas ficam sincronizadas pelo `BroadcastChannel`, inclusive quando o passador age na janela do público.

## Executar localmente

```bash
python -m http.server 8765
# público:      http://127.0.0.1:8765/
# apresentador: http://127.0.0.1:8765/apresentador/
```

A rota do apresentador lê `index.html` por `fetch`, por isso precisa ser servida por HTTP (não abre por `file://`).

## Fontes

Conteúdo e números conferidos com a versão final do relatório (TCC III, novembro de 2026). Figuras: Autor, 2026.
Produto: <https://areasprotegidas-sc.com> · Documentação: <https://diegof-d2fs.github.io/pipeline-protected-areas-sc/>
