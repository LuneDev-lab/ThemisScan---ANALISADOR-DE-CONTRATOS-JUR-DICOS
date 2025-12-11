<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1af_MJh5QGKJ5Z8WFYHPkHW7pXlaI4vG5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Crie um arquivo `.env` na raiz e defina sua chave:

   VITE_GEMINI_API_KEY=seu_token_aqui
3. Run the app:
   `npm run dev`

## Deploy (GitHub Pages)

- A base já está configurada em `vite.config.ts` como `/ThemisScan---ANALISADOR-DE-CONTRATOS-JUR-DICOS/`.
- O workflow em `.github/workflows/deploy.yml` faz o build e publica no GitHub Pages via Actions.

Passos:

1. No repositório do GitHub, crie o secret `VITE_GEMINI_API_KEY` em Settings → Secrets and variables → Actions → New repository secret.
2. Faça push para `main` (ou dispare manualmente o workflow em Actions).
3. Na primeira execução, o Pages será provisionado. O site ficará em:
   https://lunedev-lab.github.io/ThemisScan---ANALISADOR-DE-CONTRATOS-JUR-DICOS/

Comandos úteis:

```bash
# build local
npm run build

# preview local (estático)
npm run preview
```
