import { AnalysisResponse } from "../types";

// Configurações de backend e API
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';
const RAW_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_KEY = RAW_API_KEY ? RAW_API_KEY.trim() : '';
// Só usa backend se explicitamente configurado, não quando a chave está ausente
const BACKEND_ENABLED = USE_BACKEND;

const maskApiKey = (key?: string) => {
  if (!key) return 'undefined';
  if (key.length <= 8) return `${key.slice(0, 2)}***`;
  return `${key.slice(0, 4)}***${key.slice(-4)}`;
};

console.info('[GeminiService] Configuração carregada:', {
  USE_BACKEND,
  API_KEY_PRESENTE: Boolean(API_KEY),
  API_KEY_MASCARADA: maskApiKey(API_KEY),
  BACKEND_ENABLED,
});

const parseRiskLevel = (level: string): 'BAIXO' | 'MÉDIO' | 'ALTO' => {
  const upper = level.toUpperCase();
  if (upper.includes('ALTO')) return 'ALTO';
  if (upper.includes('BAIXO')) return 'BAIXO';
  return 'MÉDIO';
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

const callGeminiDirect = async (prompt: string, maxRetries: number = 3): Promise<AnalysisResponse> => {
  if (!API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY não configurada. Configure a variável de ambiente ou ative backend.');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
        {
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
        }
      );

      if (!response.ok) {
        let errorText = '';
        try {
          const parsedErr = await response.json();
          errorText = parsedErr?.error?.message || JSON.stringify(parsedErr);
        } catch (e) {
          errorText = await response.text();
        }

        console.error('Gemini API returned an error:', response.status, errorText);

        if (response.status === 400) {
          // Erro 400 pode ser chave inválida ou requisição mal formatada
          if (errorText.includes('API key not valid') || errorText.includes('API key')) {
            throw new Error(
              '❌ Chave de API inválida!\n\n' +
              'A chave configurada não é válida. Verifique:\n' +
              '1. Se você colocou a chave correta em .env.local\n' +
              '2. Se a chave não expirou ou foi revogada\n' +
              '3. Obtenha uma nova em: https://ai.google.dev/gemini-api/docs/api-key\n' +
              '4. Reinicie o servidor após editar .env.local'
            );
          }
          throw new Error('Requisição inválida (400). Verifique o formato do contrato.');
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('Chave de API inválida ou sem permissão (401/403). Verifique a chave em .env.local');
        }
        if (response.status === 429) {
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Rate limit hit (429). Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error('Limite de taxa atingido (429). Tente novamente mais tarde.');
        }
        if (response.status === 503) {
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 2000;
            console.log(`Service overloaded (503). Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error('Serviço sobrecarregado (503). O modelo está temporariamente indisponível. Tente novamente em alguns minutos.');
        }
        throw new Error(`Erro na API Gemini: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error('Invalid response structure from Gemini:', data);
        throw new Error("Resposta inválida da API Gemini. Tente novamente.");
      }

      const jsonText = data.candidates[0].content.parts[0].text;
      if (!jsonText) {
        throw new Error("Nenhuma resposta gerada pela IA. Tente novamente.");
      }

      const parsedData = JSON.parse(jsonText) as AnalysisResponse;
      return parsedData;

    } catch (error) {
      lastError = error as Error;
      if (error instanceof Error && (error.message.includes('429') || error.message.includes('503'))) {
        continue;
      }
      break;
    }
  }

  throw lastError || new Error('Falha ao chamar API Gemini após múltiplas tentativas.');
};

const callBackend = async (contractText: string, context?: string): Promise<AnalysisResponse> => {
  // Proteger contra requisições muito grandes
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (contractText.length > maxSize) {
    throw new Error('Contrato muito grande (máximo 10MB). Tente com um arquivo menor.');
  }

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: contractText,
        context: context || ''
      })
    });

    if (!response.ok) {
      let errorMsg = `Erro do servidor (${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData?.error || errorMsg;
      } catch (e) {
        // Response não é JSON
      }
      console.error('Backend error:', response.status, errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json() as AnalysisResponse;
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      console.error('Network error calling backend:', error);
      throw new Error('Erro de rede ao conectar ao servidor. Verifique a conexão ou tente novamente.');
    }
    throw error;
  }
};

export const analyzeContract = async (contractText: string, context?: string): Promise<AnalysisResponse> => {
  // Validação básica
  if (!contractText || typeof contractText !== 'string') {
    throw new Error('Contrato inválido. Forneça um texto válido.');
  }

  if (!contractText.trim()) {
    throw new Error('O contrato não pode estar vazio.');
  }

  // Validar configuração antes de prosseguir
  if (!BACKEND_ENABLED && (!API_KEY || API_KEY === 'your_gemini_api_key_here')) {
    throw new Error(
      '❌ Chave de API não configurada!\n\n' +
      '📝 Configure sua chave em .env.local:\n' +
      '1. Obtenha sua chave em: https://ai.google.dev/gemini-api/docs/api-key\n' +
      '2. Edite o arquivo .env.local\n' +
      '3. Substitua "your_gemini_api_key_here" pela sua chave real\n' +
      '4. Reinicie o servidor (npm run dev)\n\n' +
      'Ou configure VITE_USE_BACKEND=true para usar o backend serverless.'
    );
  }

  // Decidir se usa backend ou chamada direta
  if (BACKEND_ENABLED) {
    console.log('Usando backend para análise...');
    return await callBackend(contractText, context);
  }

  // Chamada direta ao Gemini
  console.log('Usando chamada direta ao Gemini API...');
  const prompt = buildPrompt(contractText, context);
  return await callGeminiDirect(prompt);
};