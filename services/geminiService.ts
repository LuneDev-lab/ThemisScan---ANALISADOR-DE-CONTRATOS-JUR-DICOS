import { AnalysisResponse } from "../types";

const parseRiskLevel = (level: string): 'BAIXO' | 'MÉDIO' | 'ALTO' => {
  const upper = level.toUpperCase();
  if (upper.includes('ALTO')) return 'ALTO';
  if (upper.includes('BAIXO')) return 'BAIXO';
  return 'MÉDIO';
};

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

export const analyzeContract = async (contractText: string, context?: string): Promise<AnalysisResponse> => {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const prompt = `
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

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: analysisSchema
          }
        })
      });

      if (!response.ok) {
        let errorText = '';
        try {
          const parsedErr = await response.json();
          errorText = parsedErr?.error?.message || JSON.stringify(parsedErr);
        } catch (e) {
          errorText = await response.text();
        }

        console.error('Gemini API returned an error:', response.status, errorText);
        if (response.status === 401 || response.status === 403) {
          throw new Error('Chave de API inválida ou sem permissão (401/403). Verifique a chave em .env');
        }
        if (response.status === 429) {
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`Rate limit hit (429). Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error('Limite de taxa atingido (429). Tente novamente mais tarde.');
        }
        if (response.status === 503) {
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 2000; // Exponential backoff: 2s, 4s, 8s for 503
            console.log(`Service overloaded (503). Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error('Serviço sobrecarregado (503). O modelo está temporariamente indisponível. Tente novamente em alguns minutos.');
        }
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error("Invalid response from Gemini API");
      }

      const jsonText = data.candidates[0].content.parts[0].text;
      if (!jsonText) {
        throw new Error("No response generated from AI");
      }

      const parsedData = JSON.parse(jsonText) as AnalysisResponse;
      return parsedData;

    } catch (error) {
      lastError = error as Error;
  if (error instanceof Error && (error.message.includes('401') || error.message.includes('403') || error.message.includes('429') || error.message.includes('503'))) {
    // These are retryable errors, continue to next attempt
    continue;
  }
  // For other errors, don't retry
  break;
    }
  }
};