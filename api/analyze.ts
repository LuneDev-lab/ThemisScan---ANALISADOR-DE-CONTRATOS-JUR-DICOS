/**
 * Serverless API handler for contract analysis using Google Gemini AI
 * 
 * ENVIRONMENT VARIABLE REQUIRED:
 * - GENAI_API_KEY: Your Google Gemini API key
 * 
 * DEPLOYMENT:
 * - This function is designed for Vercel/Netlify serverless functions
 * - Set GENAI_API_KEY in your hosting platform's environment variables
 * - For Vercel: Project Settings > Environment Variables
 * - For Netlify: Site Settings > Environment Variables
 * 
 * LOCAL DEVELOPMENT:
 * - Create a .env.local file in the project root
 * - Add: GENAI_API_KEY=your_api_key_here
 * - Run: npm run dev
 */

import { GoogleGenAI, Type, Schema } from "@google/genai";

// Schema definition for structured AI response
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

interface RequestBody {
  contractText: string;
  context?: string;
}

/**
 * Serverless function handler
 * Compatible with Vercel and Netlify serverless functions
 */
export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    // Check for API key in environment variables
    const apiKey = process.env.GENAI_API_KEY;
    
    if (!apiKey) {
      console.error('GENAI_API_KEY environment variable is not set');
      return res.status(500).json({ 
        error: 'Configuration error',
        message: 'API key is not configured on the server. Please contact the administrator.'
      });
    }

    // Parse and validate request body
    const body: RequestBody = req.body;
    
    if (!body || !body.contractText) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Missing required field: contractText'
      });
    }

    const { contractText, context } = body;

    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey });

    // Construct the prompt
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

    // Call Gemini AI
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
      console.error('No response generated from AI');
      return res.status(500).json({ 
        error: 'AI error',
        message: 'No response generated from AI. Please try again.'
      });
    }

    // Parse and return the analysis
    const data = JSON.parse(jsonText);
    return res.status(200).json(data);

  } catch (error: any) {
    // Log detailed error on server
    console.error('Error analyzing contract:', error);
    
    // Return user-friendly error message
    return res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message || 'An unexpected error occurred during analysis. Please try again.'
    });
  }
}
