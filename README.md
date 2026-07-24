# Skill Evaluator

Ferramenta que audita um `SKILL.md` (skill de Claude Code) contra um framework de 4 eixos que decide se uma skill vai funcionar de forma previsível ou vai virar "skill hell": gatilho, estrutura, direcionamento e poda.

**[Testar agora → gbrito90.github.io/skill-evaluator](https://gbrito90.github.io/skill-evaluator/)**

Roda 100% no navegador. Sem IA, sem backend, sem coletar nada: o motor é puramente heurístico (parsing de frontmatter, listas de leading words, similaridade de parágrafos para achar duplicação).

## O problema que isso resolve

A maioria de nós escreve skill do jeito que escreve prompt: tentando ser claro. Funciona hoje, quebra na sessão seguinte, e ninguém sabe dizer o porquê. O problema nunca foi falta de skill disponível — é falta de um jeito comum de julgar as que você já tem.

Esse framework (baseado na palestra *The Missing Manual: How to Write Great Skills*, de Matt Pocock) argumenta que o objetivo de uma skill não é gerar o mesmo output toda vez, é gerar o mesmo processo toda vez. Existem 4 eixos que decidem isso:

- **Gatilho** — quem aciona a skill decide quem paga a conta. Acionamento pelo modelo custa *context load* (token em toda requisição futura); acionamento manual custa *cognitive load* (você precisa lembrar que a skill existe).
- **Estrutura** — o SKILL.md pequeno é o objetivo, não um efeito colateral. Passos ficam no arquivo principal; material de apoio vira referência externa (progressive disclosure).
- **Direcionamento** — *leading words* (termos que já carregam significado inteiro no pré-treino do modelo, como "vertical slice") funcionam melhor que instrução longa e genérica.
- **Poda** — os 5 jeitos de uma skill dar errado sem você perceber: duplicação, sedimento, sprawl, premature completion e no-op (parágrafos que parecem instrução mas não mudam nada no comportamento do agente).

## Como usar

1. Cole o conteúdo do seu `SKILL.md` (ou clique em "usar exemplo" para ver com uma skill de exemplo), ou faça upload do arquivo `.md`.
2. Opcionalmente, envie os arquivos de referência que o SKILL.md cita — a ferramenta cruza o que é citado no corpo com o que foi realmente enviado.
3. Responda o pré-check de 2 perguntas do framework (a tarefa se repete de verdade? dá pra nomear o processo numa frase?).
4. Veja o relatório: cada um dos 4 eixos recebe um veredito (bom / atenção / crítico), achados automáticos com o porquê, e um checklist manual para os itens que exigem julgamento humano — como o teste do no-op, que por definição não dá pra automatizar (apague o parágrafo, rode de novo, veja se mudou algo).

## O que a ferramenta detecta automaticamente

- `disable-model-invocation` no frontmatter e o trade-off de gatilho que isso implica.
- Tamanho do corpo do SKILL.md e presença de referências externas (candidata a split se estiver grande e sem referência).
- Leading words reconhecidas (lista em PT e EN) vs. instrução genérica ("faça o melhor possível", "as appropriate"...).
- Planejamento e perguntas de esclarecimento misturados na mesma skill (o agente tende a correr pelas perguntas pra chegar no plano).
- Duplicação de conteúdo entre parágrafos (similaridade de Jaccard).
- Referências citadas no corpo sem arquivo correspondente enviado, e vice-versa.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`.

## Stack

Next.js (App Router, static export) + TypeScript + Tailwind CSS v4 + Phosphor Icons. Publicado no GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`).

## Documentação da revisão de design

Veja [`DESIGN_REVIEW.md`](./DESIGN_REVIEW.md) para a auditoria de acessibilidade e consistência visual feita sobre este app.
