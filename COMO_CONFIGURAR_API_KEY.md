# 🔑 Como Configurar sua Chave de API do Gemini

## ⚠️ Problema Resolvido

O erro que você estava vendo:
```
Failed to load resource: the server responded with a status of 400
Gemini API returned an error: 400 API key not valid. Please pass a valid API key.
```

Acontecia porque o arquivo `.env.local` não existia ou a chave não estava configurada.

## ✅ Solução: Configure sua Chave de API

### Passo 1: Obtenha sua Chave de API

1. Acesse: **https://ai.google.dev/gemini-api/docs/api-key**
2. Clique em **"Get an API key"**
3. Faça login com sua conta Google
4. Clique em **"Create API key"**
5. Copie a chave gerada (começa com `AIzaSy...`)

### Passo 2: Configure o arquivo .env.local

O arquivo `.env.local` já foi criado para você. Agora você precisa editá-lo:

1. **Abra o arquivo** `.env.local` na raiz do projeto
2. **Localize a linha**:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. **Substitua** `your_gemini_api_key_here` pela sua chave real:
   ```env
   VITE_GEMINI_API_KEY=AIzaSyABC123def456GHI789jkl...
   ```
4. **Salve o arquivo**

### Passo 3: Reinicie o Servidor

**IMPORTANTE:** Após editar o `.env.local`, você **DEVE** reiniciar o servidor:

```bash
# Pare o servidor atual (Ctrl+C no terminal)
# Depois execute:
npm run dev
```

### Passo 4: Teste

1. Acesse a aplicação (geralmente `http://localhost:5173`)
2. Cole um texto de contrato
3. Clique em "Analisar Contrato"
4. ✅ A análise deve funcionar agora!

## 🔍 Verificando se está Funcionando

Quando você clicar em "Analisar Contrato":

### ✅ Se estiver configurado corretamente:
- O botão mostrará "Analisando..."
- Após alguns segundos, aparecerá o resultado da análise

### ❌ Se ainda estiver com problema:
Você verá uma mensagem clara explicando o que fazer:
```
❌ Chave de API não configurada!

📝 Configure sua chave em .env.local:
1. Obtenha sua chave em: https://ai.google.dev/gemini-api/docs/api-key
2. Edite o arquivo .env.local
3. Substitua "your_gemini_api_key_here" pela sua chave real
4. Reinicie o servidor (npm run dev)
```

## 🛡️ Alternativa: Usar Backend (Produção)

Se você não quiser expor a chave no frontend, pode usar o backend serverless:

1. **Configure `.env.local`**:
   ```env
   VITE_USE_BACKEND=true
   ```

2. **Configure a chave no servidor** (Vercel/Netlify):
   - Variável: `GEMINI_API_KEY`
   - Valor: sua chave

3. **Deploy** da aplicação

## 📝 Exemplo Completo de .env.local

```env
# .env.local (Desenvolvimento Local)

# Sua chave de API do Gemini (SUBSTITUA pela chave real!)
VITE_GEMINI_API_KEY=AIzaSyABC123def456GHI789jkl0MNO123pqr456stu

# Descomente para usar backend em vez de chamada direta
# VITE_USE_BACKEND=true
```

## 🐛 Troubleshooting

### Erro: "API key not valid"
- **Causa**: Chave incorreta ou expirada
- **Solução**: Gere uma nova chave em https://ai.google.dev

### Erro: "key=undefined"
- **Causa**: Servidor não foi reiniciado após editar `.env.local`
- **Solução**: Pare o servidor (Ctrl+C) e execute `npm run dev` novamente

### Página ainda em branco
- **Causa**: Erro não tratado
- **Solução**: 
  1. Abra DevTools (F12)
  2. Vá na aba Console
  3. Veja a mensagem de erro
  4. Copie e reporte como issue

## ✅ Checklist

- [ ] Obtive minha chave em https://ai.google.dev
- [ ] Editei o arquivo `.env.local` com minha chave real
- [ ] Reiniciei o servidor (`npm run dev`)
- [ ] Testei clicando em "Analisar Contrato"
- [ ] A análise funcionou! 🎉

---

**Precisa de ajuda?** Abra uma issue no repositório com detalhes do erro.
