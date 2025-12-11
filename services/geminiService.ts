import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResponse } from "../types";

const parseRiskLevel = (level: string): 'BAIXO' | 'MÉDIO' | 'ALTO' => {
  const upper = level.toUpperCase();
  if (upper.includes('ALTO')) return 'ALTO';
  if (upper.includes('BAIXO')) return 'BAIXO';
  return 'MÉDIO';
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description: "Resumo executivo em 3-5 linhas (Tipo, partes, duração, valor).",
    },
    contractType: {
      type: Type.STRING,
      description: "O tipo de contrato identificado (ex: Prestação de Serviços).",
    },
    riskLevel: {
      type: Type.STRING,
      enum: ["BAIXO", "MÉDIO", "ALTO"],
      description: "Status de risco geral.",
    },
    riskClauses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clause: { type: Type.STRING, description: "A cláusula problemática." },
          reason: { type: Type.STRING, description: "Por que é perigosa (linguagem simples)." },
          impact: { type: Type.STRING, description: "Quem se prejudica." },
          recommendation: { type: Type.STRING, description: "Recomendação de mudança específica." },
        },
        required: ["clause", "reason", "impact", "recommendation"],
      },
    },
    missingTerms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de termos importantes que estão faltando.",
    },
    favorableTerms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clause: { type: Type.STRING, description: "A cláusula favorável." },
          benefit: { type: Type.STRING, description: "Por que é vantajoso." },
        },
        required: ["clause", "benefit"],
      },
    },
    practicalRecommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Ações práticas priorizadas para o advogado/cliente.",
    },
    clientQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
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
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found in environment variables");
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Você é um assistente jurídico sênior especializado em análise de contratos sob a legislação brasileira (Código Civil, CDC, etc.).
      
      Analise o seguinte contrato com extremo rigor. Identifique riscos, cláusulas abusivas, termos faltantes e oportunidades.
      Seja prático e direto. Foco na proteção de quem está recebendo esta análise.
      
      ${context ? `CONTEXTO ADICIONAL FORNECIDO PELO USUÁRIO: ${context}` : ''}

      CONTRATO PARA ANÁLISE:
      ---
      ${contractText}
      ---
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2, // Lower temperature for more analytical/consistent results
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response generated from AI");
    }

    const data = JSON.parse(jsonText) as AnalysisResponse;
    return data;

  } catch (error) {
    console.error("Error analyzing contract:", error);
    throw error;
  }
};