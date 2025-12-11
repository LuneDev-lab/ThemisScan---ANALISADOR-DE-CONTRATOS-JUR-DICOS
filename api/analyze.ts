/**
 * Serverless API Handler for Contract Analysis
 * 
 * ENVIRONMENT VARIABLE REQUIRED:
 * - GENAI_API_KEY: Your Google Generative AI API key
 * 
 * HOSTING RECOMMENDATIONS:
 * - Vercel: Automatically detects /api directory for serverless functions
 * - Netlify: Configure as Netlify Functions (may need netlify.toml)
 * 
 * LOCAL TESTING:
 * 1. Create a .env.local file with GENAI_API_KEY=your_key_here
 * 2. Run `npm run dev`
 * 3. Test endpoint: POST http://localhost:3000/api/analyze
 */

import { GoogleGenAI, Type, Schema } from "@google/genai";

// Analysis response schema - kept identical to the original frontend implementation
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

interface AnalyzeRequest {
  contractText: string;
  context?: string;
}

/**
 * Main serverless handler function
 * Compatible with Vercel/Next-style serverless functions
 */
export default async function handler(req: any, res: any) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted' 
    });
  }

  try {
    // Check for API key in environment
    const apiKey = process.env.GENAI_API_KEY;
    if (!apiKey) {
      console.error('GENAI_API_KEY environment variable is not set');
      return res.status(500).json({ 
        error: 'Configuration error',
        message: 'Server is not properly configured. Please set GENAI_API_KEY environment variable.' 
      });
    }

    // Parse request body
    const body: AnalyzeRequest = req.body;
    
    if (!body.contractText || typeof body.contractText !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'contractText is required and must be a string' 
      });
    }

    // Initialize Google Generative AI client
    const ai = new GoogleGenAI({ apiKey });

    // Build the prompt - same structure as original implementation
    const prompt = `
      Você é um assistente jurídico sênior especializado em análise de contratos sob a legislação brasileira (Código Civil, CDC, etc.).
      
      Analise o seguinte contrato com extremo rigor. Identifique riscos, cláusulas abusivas, termos faltantes e oportunidades.
      Seja prático e direto. Foco na proteção de quem está recebendo esta análise.
      
      ${body.context ? `CONTEXTO ADICIONAL FORNECIDO PELO USUÁRIO: ${body.context}` : ''}

      CONTRATO PARA ANÁLISE:
      ---
      ${body.contractText}
      ---
    `;

    // Call the Gemini API with same configuration as original
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

    // Parse and validate the response
    const data = JSON.parse(jsonText);
    
    // Return successful response
    return res.status(200).json(data);

  } catch (error) {
    // Log error to server console for debugging
    console.error("Error analyzing contract:", error);
    
    // Return user-friendly error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ 
      error: 'Analysis failed',
      message: 'Failed to analyze contract. Please try again.',
      details: errorMessage
    });
  }
}
