# Skill Evaluator

Audita um `SKILL.md` (skill de Claude Code) contra os 4 eixos do framework de previsibilidade de skills: **gatilho**, **estrutura**, **direcionamento** e **poda**.

Tudo roda no navegador, sem IA e sem backend — o motor é 100% heurístico (parsing de frontmatter, listas de leading words, similaridade de parágrafos para detectar duplicação).

## Como usar

1. Cole o conteúdo do seu `SKILL.md` (ou clique em "usar exemplo"), ou faça upload do arquivo.
2. Opcionalmente, envie os arquivos de referência que o SKILL.md cita.
3. Responda o pré-check de 2 perguntas do framework.
4. Veja o relatório: cada eixo recebe um veredito (bom / atenção / crítico), achados automáticos e um checklist manual para os itens que exigem julgamento humano (como o teste do no-op).

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4 + Phosphor Icons.

## Documentação da revisão de design

Veja [`DESIGN_REVIEW.md`](./DESIGN_REVIEW.md) para a auditoria de acessibilidade e consistência visual feita sobre este app.
