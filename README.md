<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ThemisScan - Analisador de Contratos Jurídicos

Ferramenta de análise de contratos alimentada por IA (Google Gemini) para identificar riscos, cláusulas abusivas e oportunidades sob a legislação brasileira.

## Recursos

- **Análise inteligente de contratos** usando Google Gemini API
- **Identificação de riscos** com nível de severidade (BAIXO, MÉDIO, ALTO)
- **Cláusulas perigosas** com recomendações específicas
- **Termos faltantes** importantes para proteção jurídica
- **Cláusulas favoráveis** destacadas
- **Recomendações práticas** priorizadas para ação
- **Compatível com múltiplos formatos**: texto, PDF, DOCX
- **Modo backend seguro** para não expor chaves no frontend

## Instalação e Execução Local

### Pré-requisitos
- Node.js 16+ e npm/yarn

### Passos

1. **Clone o repositório**
   ```bash
   git clone <seu-repo>
   cd ThemisScan---ANALISADOR-DE-CONTRATOS-JUR-DICOS
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure variáveis de ambiente**

   Crie um arquivo `.env.local` na raiz do projeto:

   ```env
   # Opção 1: Usando API diretamente no frontend (desenvolvimento local)
   VITE_GEMINI_API_KEY=sua_chave_gemini_aqui

   # Opção 2: Usando backend serverless (recomendado para produção)
   # Descomente a linha abaixo e defina no servidor
   # VITE_USE_BACKEND=true
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

   A aplicação estará disponível em `http://localhost:5173` (ou a porta indicada pelo Vite).

## Variáveis de Ambiente

### Frontend (`.env.local`)

| Variável | Descrição | Obrigatória | Exemplos |
|----------|-----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Chave de API do Google Gemini | Não* | `AIzaSy...` |
| `VITE_USE_BACKEND` | Se `true`, usa `/api/analyze` em vez de chamar Gemini diretamente | Não | `true` / `false` |

*Se não configurada e `VITE_USE_BACKEND` não estiver ativo, a análise falhará.

### Backend/Servidor (variáveis de ambiente do servidor)

| Variável | Descrição | Obrigatória | Exemplos |
|----------|-----------|-------------|----------|
| `GEMINI_API_KEY` | Chave de API do Google Gemini (lado servidor) | **Sim (se usar backend)** | `AIzaSy...` |

## Arquitetura: Frontend vs Backend

### Modo 1: Frontend Direto (Desenvolvimento Local)

```
Frontend (App) 
  ↓
Gemini API (https://generativelanguage.googleapis.com)
  ↓
Resposta JSON
```

**Uso:**
- Desenvolvimento local
- Testes
- **NÃO recomendado para produção** (expõe chave)

**Configuração:**
```env
VITE_GEMINI_API_KEY=sua_chave
# VITE_USE_BACKEND não definido ou false
```

### Modo 2: Backend Serverless (Recomendado para Produção)

```
Frontend (App)
  ↓
Backend Serverless (/api/analyze)
  ↓
Gemini API
  ↓
Resposta JSON
```

**Uso:**
- Produção
- Seguro (chave fica no servidor)
- Escalável

**Configuração:**

Frontend (`.env.local`):
```env
VITE_USE_BACKEND=true
# VITE_GEMINI_API_KEY não é necessária
```

Servidor (Vercel/Netlify/Custom):
```env
GEMINI_API_KEY=sua_chave_secreto
```

## Deploy em Produção

### Deploy em Vercel

1. **Conecte o repositório ao Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure variável de ambiente no Vercel Dashboard**
   - Acesse `Settings > Environment Variables`
   - Adicione: `GEMINI_API_KEY = sua_chave_aqui`

3. **Configure frontend para usar backend**
   - Atualize `.env.local`:
   ```env
   VITE_USE_BACKEND=true
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Deploy em Netlify

1. **Conecte o repositório ao Netlify**
   - Vá para https://app.netlify.com
   - Selecione "New site from Git"

2. **Configure o build**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Configure variáveis de ambiente**
   - Acesse `Site Settings > Build & deploy > Environment`
   - Adicione: `GEMINI_API_KEY = sua_chave_aqui`

4. **Configure frontend para usar backend**
   - Atualize `.env.local`:
   ```env
   VITE_USE_BACKEND=true
   ```

5. **Deploy automático**
   - Push para a branch principal triggera o deploy automaticamente

## Build e Teste Local

### Build para Produção

```bash
npm run build
```

Isso criará a pasta `dist/` com os arquivos otimizados.

### Servir Localmente

Para testar o build:

```bash
npm install -g serve
serve -s dist
```

Acesse em `http://localhost:3000` (a porta pode variar).

### Reproduzir Fluxo Completo

1. **Sem Backend (apenas frontend)**
   ```env
   VITE_GEMINI_API_KEY=sua_chave
   # Sem VITE_USE_BACKEND
   ```
   - Cole um contrato
   - Clique "Analisar Contrato"
   - Verifique a resposta

2. **Com Backend**
   - Configure `GEMINI_API_KEY` no servidor
   - Configure frontend:
   ```env
   VITE_USE_BACKEND=true
   ```
   - Cole um contrato
   - Clique "Analisar Contrato"
   - Verif se a análise é retornada do servidor

## Estrutura do Projeto

```
.
├── api/
│   └── analyze.ts              # Endpoint serverless (Vercel/Netlify)
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── InputSection.tsx
│   ├── AnalysisResult.tsx
│   └── ErrorBoundary.tsx       # Error Boundary React
├── services/
│   └── geminiService.ts        # Lógica de integração Gemini
├── App.tsx
├── index.tsx
├── types.ts
├── vite.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Tratamento de Erros

### Mensagens de Erro Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "VITE_GEMINI_API_KEY não configurada" | Chave não está em `.env.local` | Configure a chave ou ative `VITE_USE_BACKEND` |
| "Chave de API inválida (401/403)" | Chave está inválida ou revogada | Gere uma nova chave no [Google AI Studio](https://ai.google.dev) |
| "Limite de taxa atingido (429)" | Muitas requisições | Aguarde alguns minutos |
| "Serviço sobrecarregado (503)" | Gemini API offline | Tente novamente em alguns minutos |
| "Erro de rede" | Conexão com internet | Verifique sua conexão |
| "Tela branca" | Erro não tratado | Abra DevTools (F12) e verifique Console |

### Debug

1. **Abra o Console do Navegador** (F12 → Aba "Console")
2. **Cole um contrato e clique "Analisar"**
3. **Procure por logs** como:
   ```
   Usando chamada direta ao Gemini API...
   Usando backend para análise...
   Gemini API error: 401 ...
   ```

## Scripts Disponíveis

```bash
npm run dev       # Inicia servidor de desenvolvimento
npm run build     # Build para produção (gera dist/)
npm run preview   # Preview do build localmente
```

## Estrutura do Endpoint `/api/analyze`

### Request (POST)

```json
{
  "text": "Contrato em texto...",
  "context": "Contexto adicional (opcional)"
}
```

### Response (200 OK)

```json
{
  "executiveSummary": "Resumo...",
  "contractType": "Tipo do contrato",
  "riskLevel": "ALTO",
  "riskClauses": [
    {
      "clause": "Cláusula...",
      "reason": "Por que é perigosa",
      "impact": "Quem se prejudica",
      "recommendation": "O que fazer"
    }
  ],
  "missingTerms": ["Termo 1", "Termo 2"],
  "favorableTerms": [...],
  "practicalRecommendations": [...],
  "clientQuestions": [...]
}
```

### Response (Erro)

```json
{
  "error": "Mensagem de erro legível"
}
```

**Status codes:**
- `200`: Análise bem-sucedida
- `400`: Requisição inválida (text vazio, etc)
- `413`: Payload muito grande (>10MB)
- `429`: Rate limit (tente novamente em alguns minutos)
- `500`: Erro do servidor (chave inválida, etc)
- `502`: Erro na API Gemini
- `503`: Serviço indisponível

## Tecnologias Utilizadas

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Google Gemini API** - AI Analysis
- **Vercel/Netlify** - Serverless Functions

## Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

## Suporte

Para reportar bugs ou sugerir features, abra uma [Issue](https://github.com/seu-user/seu-repo/issues).

---

**Desenvolvido com ❤️ para análise jurídica segura e acessível.**

