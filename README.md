<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ThemisScan - Analisador de Contratos Jurídicos

Ferramenta de análise de contratos jurídicos com IA, usando Google Generative AI.

## Configuração e Execução Local

**Pré-requisitos:** Node.js (versão 18 ou superior)

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar a chave de API:**
   
   Crie um arquivo `.env.local` na raiz do projeto com:
   ```
   GENAI_API_KEY=sua_chave_api_aqui
   ```
   
   Para obter uma chave de API gratuita:
   - Acesse: https://ai.google.dev/
   - Faça login com sua conta Google
   - Crie uma nova chave de API

3. **Executar localmente com suporte a serverless:**

   **Opção 1: Usando Vercel CLI (Recomendado)**
   ```bash
   npm install -g vercel
   vercel dev
   ```
   O Vercel CLI automaticamente detecta e executa as funções serverless em `/api`.
   
   **Opção 2: Usando Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify dev
   ```
   
   **Nota:** O comando `npm run dev` executa apenas o frontend Vite e **não** suporta as funções serverless em `/api`. Use Vercel CLI ou Netlify CLI para desenvolvimento local completo.

## Deploy em Produção

### Vercel (Recomendado)

1. Faça fork/clone deste repositório
2. Importe o projeto no Vercel
3. Configure a variável de ambiente:
   - Nome: `GENAI_API_KEY`
   - Valor: Sua chave de API do Google Generative AI
4. Deploy automático!

### Netlify

1. Faça fork/clone deste repositório
2. Importe o projeto no Netlify
3. Configure a variável de ambiente:
   - Nome: `GENAI_API_KEY`
   - Valor: Sua chave de API do Google Generative AI
4. Configure o build:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `api`
5. Deploy!

## Arquitetura de Segurança

A aplicação usa uma arquitetura client-server para proteger a chave de API:

- **Frontend (Client-side):** Interface React que envia contratos para análise
- **Backend (Server-side):** API serverless (`/api/analyze`) que:
  - Recebe requisições do frontend
  - Usa a chave de API armazenada de forma segura no servidor
  - Chama o Google Generative AI
  - Retorna os resultados da análise

**Importante:** A chave de API **NUNCA** é exposta no código do cliente ou no bundle JavaScript.

## Tecnologias Utilizadas

- React + TypeScript
- Vite
- Google Generative AI (Gemini)
- Tailwind CSS
- Lucide React (ícones)

## Link do App

View your app in AI Studio: https://ai.studio/apps/drive/1af_MJh5QGKJ5Z8WFYHPkHW7pXlaI4vG5
