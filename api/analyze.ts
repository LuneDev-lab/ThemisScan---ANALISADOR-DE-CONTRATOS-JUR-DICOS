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

    // Chamar Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`,
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

    // Processar resposta
    if (!response.ok) {
      let errorMessage = `Erro na API Gemini (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.error?.message || JSON.stringify(errorData);
      } catch (e) {
        // Response não é JSON, usar status text
        errorMessage = response.statusText || errorMessage;
      }

      console.error('[api/analyze] Gemini API error:', response.status, errorMessage);

      // Tratar status específicos
      if (response.status === 401 || response.status === 403) {
        res.status(500).json({ error: 'API key inválida ou sem permissão no servidor.' });
        return;
      }
      if (response.status === 429) {
        res.status(429).json({ error: 'Limite de requisições atingido. Tente novamente em alguns minutos.' });
        return;
      }
      if (response.status === 503) {
        res.status(503).json({ error: 'Serviço Gemini temporariamente indisponível. Tente novamente em alguns minutos.' });
        return;
      }

      res.status(502).json({ error: `Erro ao processar análise: ${errorMessage}` });
      return;
    }

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
