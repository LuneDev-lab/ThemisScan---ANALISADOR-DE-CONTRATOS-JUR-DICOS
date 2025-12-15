// api/analyze.ts - Endpoint serverless (Vercel/Netlify compatible)
// Deploy em Vercel/Netlify e configure a variável de ambiente GEMINI_API_KEY no dashboard

const analysisSchema = {
  type: "object",
  properties: {
    executiveSummary: {
      type: "string",
      description: "Resumo executivo em 3-5 linhas (Tipo, partes, duração, valor).",
    },
    contractType: {
      type: "string",
      description: "O tipo de contrato identificado (ex: Prestação de Serviços).",
    },
    riskLevel: {
      type: "string",
      enum: ["BAIXO", "MÉDIO", "ALTO"],
      description: "Status de risco geral.",
    },
    riskClauses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clause: { type: "string", description: "A cláusula problemática." },
          reason: { type: "string", description: "Por que é perigosa (linguagem simples)." },
          impact: { type: "string", description: "Quem se prejudica." },
          recommendation: { type: "string", description: "Recomendação de mudança específica." },
        },
        required: ["clause", "reason", "impact", "recommendation"],
      },
    },
    missingTerms: {
      type: "array",
      items: { type: "string" },
      description: "Lista de termos importantes que estão faltando.",
    },
    favorableTerms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clause: { type: "string", description: "A cláusula favorável." },
          benefit: { type: "string", description: "Por que é vantajoso." },
        },
        required: ["clause", "benefit"],
      },
    },
    practicalRecommendations: {
      type: "array",
      items: { type: "string" },
      description: "Ações práticas priorizadas para o advogado/cliente.",
    },
    clientQuestions: {
      type: "array",
      items: { type: "string" },
      description: "Perguntas para pedir contexto ao cliente, se necessário.",
    },
  },
  required: [
    "executiveSummary",
    "contractType",
    "riskLevel",
    "riskClauses",
    "missingTerms",
    "favorableTerms",
    "practicalRecommendations",
    "clientQuestions",
  ],
};

const buildPrompt = (contractText: string, context?: string): string => {
  return `
    Você é um assistente jurídico sênior especializado em análise de contratos sob a legislação brasileira (Código Civil, CDC, etc.).

    Analise o seguinte contrato com extremo rigor. Identifique riscos, cláusulas abusivas, termos faltantes e oportunidades.
    Seja prático e direto. Foco na proteção de quem está recebendo esta análise.

    ${context ? `CONTEXTO ADICIONAL FORNECIDO PELO USUÁRIO: ${context}` : ''}

    CONTRATO PARA ANÁLISE:
    ---
    ${contractText}
    ---

    Responda APENAS com um objeto JSON válido seguindo exatamente este schema:
    ${JSON.stringify(analysisSchema, null, 2)}
  `;
};

// Tipo para Vercel
type VercelRequest = {
  method: string;
  body: any;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { text, context } = req.body || {};

  // Validar input
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Campo "text" é obrigatório e deve ser uma string.' });
    return;
  }

  if (text.trim().length === 0) {
    res.status(400).json({ error: 'O contrato não pode estar vazio.' });
    return;
  }

  // Proteção contra payloads muito grandes (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (text.length > maxSize) {
    res.status(413).json({ error: 'Contrato muito grande (máximo 10MB).' });
    return;
  }

  // Verificar presença da chave de API
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error('[api/analyze] GEMINI_API_KEY não configurada no servidor');
    res.status(500).json({ error: 'Servidor não configurado com API key.' });
    return;
  }

  try {
    const prompt = buildPrompt(text, context);

    // Lista de modelos para tentar (fallback strategy)
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-1.5-pro'];
    let lastError = null;
    let successResponse = null;

    for (const model of models) {
      try {
        console.log(`[api/analyze] Tentando modelo: ${model}`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
                responseSchema: analysisSchema,
              },
            }),
          }
        );

        if (response.ok) {
          successResponse = response;
          break; // Sucesso!
        }

        // Se falhar, capturar erro e tentar próximo
        const errorText = await response.text();
        console.warn(`[api/analyze] Falha no modelo ${model}: ${response.status} - ${errorText}`);
        lastError = { status: response.status, message: errorText };
        
        // Se for erro de chave (400/403), não adianta tentar outros modelos
        if (response.status === 400 && (errorText.includes('API key') || errorText.includes('INVALID_ARGUMENT'))) {
             // INVALID_ARGUMENT pode ser modelo, então continuamos. Mas API Key invalida paramos.
             if (errorText.includes('API key')) break;
        }
        if (response.status === 401 || response.status === 403) break;

      } catch (e) {
        console.error(`[api/analyze] Erro de rede/fetch com modelo ${model}:`, e);
        lastError = { status: 500, message: (e as Error).message };
      }
    }

    if (!successResponse) {
      // TENTATIVA DE DIAGNÓSTICO: Listar modelos disponíveis
      try {
        console.log('[api/analyze] Tentando listar modelos disponíveis para diagnóstico...');
        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        if (listResp.ok) {
            const listData = await listResp.json();
            const availableModels = listData.models?.map((m: any) => m.name.replace('models/', '')) || [];
            console.error('[api/analyze] Modelos disponíveis para esta chave:', availableModels);
            
            res.status(500).json({ 
                error: `Erro de Modelo: Nenhum dos modelos padrão funcionou. Sua chave tem acesso a: ${availableModels.join(', ')}. Verifique se a API 'Generative Language' está ativada no Google Cloud.` 
            });
            return;
        } else {
            const listErr = await listResp.text();
            console.error('[api/analyze] Erro ao listar modelos:', listErr);
            // Se falhar ao listar, provavelmente a chave é inválida ou não tem permissão nenhuma
            if (listResp.status === 400 || listResp.status === 403) {
                 res.status(500).json({ error: `Chave de API inválida ou sem permissão (Erro ${listResp.status}). Verifique se a API 'Generative Language' está habilitada no seu projeto Google Cloud.` });
                 return;
            }
        }
      } catch (diagErr) {
        console.error('[api/analyze] Falha no diagnóstico:', diagErr);
      }

      const status = lastError?.status || 500;
      const status = lastError?.status || 500;
      const msg = lastError?.message || 'Falha em todos os modelos disponíveis.';
      
      // Melhorar mensagem de erro para o usuário
      if (msg.includes('not found')) {
         res.status(status).json({ error: `Erro de configuração: Modelos Gemini não encontrados. Verifique a API Key.` });
         return;
      }
      
      res.status(status).json({ error: `Erro na API Gemini: ${msg}` });
      return;
    }

    const response = successResponse;
    // Processar resposta (código original continua aqui...)


    const data = await response.json();

    // Validar estrutura da resposta
    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0]
    ) {
      console.error('[api/analyze] Invalid response structure:', data);
      res.status(502).json({ error: 'Resposta inválida da API Gemini.' });
      return;
    }

    const jsonText = data.candidates[0].content.parts[0].text;
    if (!jsonText) {
      console.error('[api/analyze] No text in response');
      res.status(502).json({ error: 'Nenhuma resposta gerada pela IA.' });
      return;
    }

    // Parse JSON da resposta
    const analysisResult = JSON.parse(jsonText);
    res.status(200).json(analysisResult);
  } catch (err) {
    console.error('[api/analyze] Server error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    res.status(500).json({ error: `Erro interno ao processar análise: ${errorMessage}` });
  }
}
