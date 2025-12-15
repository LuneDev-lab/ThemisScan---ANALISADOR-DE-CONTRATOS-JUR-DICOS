# Configuração de Variáveis de Ambiente na Vercel

Para que o ThemisScan funcione corretamente na Vercel (sem expor sua chave de API e evitando erros), você precisa configurar as variáveis de ambiente no painel da Vercel.

## Passo a Passo

1. Acesse o painel do seu projeto na **Vercel**.
2. Vá em **Settings** (Configurações) > **Environment Variables**.
3. Adicione as seguintes variáveis:

### 1. Ativar o Backend (Obrigatório)
Isso diz ao frontend para parar de tentar usar a chave local e chamar a API segura.
- **Key:** `VITE_USE_BACKEND`
- **Value:** `true`

### 2. Chave da API Gemini (Obrigatório para o Backend)
Esta é a chave que o servidor usará para falar com o Google.
- **Key:** `GEMINI_API_KEY`
- **Value:** `Sua_Chave_API_Aqui` (começa com AIza...)

### 3. URL Base (Opcional, mas recomendado)
Garante que o app saiba onde está rodando.
- **Key:** `VITE_BASE_PATH`
- **Value:** `/`

---

## ⚠️ Importante: Redeploy Necessário

Após adicionar as variáveis, elas não funcionam imediatamente no site que já está no ar. Você precisa fazer um novo deploy:

1. Vá na aba **Deployments**.
2. Clique no botão de três pontos (...) no deploy mais recente ou no botão "Redeploy".
3. Aguarde o processo finalizar.

## Como verificar se funcionou?

Quando o erro mudar ou desaparecer:
- Se o erro "Chave de API inválida... .env.local" sumir, significa que o frontend agora está tentando usar o backend.
- Se aparecer um erro novo, verifique os **Logs** da Vercel (aba Functions) para ver o que aconteceu no servidor.
