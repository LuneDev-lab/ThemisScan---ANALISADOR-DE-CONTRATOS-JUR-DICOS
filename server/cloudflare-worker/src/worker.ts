export interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGIN?: string;
}

const analysisSchema = {
  type: "object",
  properties: {
    executiveSummary: { type: "string", description: "Resumo executivo em 3-5 linhas (Tipo, partes, duração, valor)." },
    contractType: { type: "string", description: "O tipo de contrato identificado (ex: Prestação de Serviços)." },
    riskLevel: { type: "string", enum: ["BAIXO", "MÉDIO", "ALTO"], description: "Status de risco geral." },
    riskClauses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clause: { type: "string", description: "A cláusula problemática." },
          reason: { type: "string", description: "Por que é perigosa (linguagem simples)." },
          impact: { type: "string", description: "Quem se prejudica." },
          recommendation: { type: "string", description: "Recomendação de mudança específica." }
        },
        required: ["clause", "reason", "impact", "recommendation"]
      }
    },
    missingTerms: { type: "array", items: { type: "string" }, description: "Lista de termos importantes que estão faltando." },
    favorableTerms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clause: { type: "string", description: "A cláusula favorável." },
          benefit: { type: "string", description: "Por que é vantajoso." }
        },
        required: ["clause", "benefit"]
      }
    },
    practicalRecommendations: { type: "array", items: { type: "string" }, description: "Ações práticas priorizadas para o advogado/cliente." },
    clientQuestions: { type: "array", items: { type: "string" }, description: "Perguntas para pedir contexto ao cliente, se necessário." }
  },
  required: [
    "executiveSummary",
    "contractType",
    "riskLevel",
    "riskClauses",
    "missingTerms",
    "favorableTerms",
    "practicalRecommendations",
    "clientQuestions"
  ]
};

function buildPrompt(contractText: string, context?: string) {
  return `Você é um assistente jurídico sênior especializado em análise de contratos sob a legislação brasileira (Código Civil, CDC, etc.).\n\nAnalise o seguinte contrato com extremo rigor. Identifique riscos, cláusulas abusivas, termos faltantes e oportunidades.\nSeja prático e direto. Foco na proteção de quem está recebendo esta análise.\n\n${context ? `CONTEXTO ADICIONAL FORNECIDO PELO USUÁRIO: ${context}\n\n` : ''}CONTRATO PARA ANÁLISE:\n---\n${contractText}\n---`;
}

function corsHeaders(origin: string | null, allowed: string | undefined) {
  // Permite * por padrão ou respeita ALLOWED_ORIGIN
  const allowOrigin = allowed && allowed !== '*' ? (origin && origin.startsWith(allowed) ? origin : allowed) : (origin ?? '*');
  return {
    "Access-Control-Allow-Origin": allowOrigin || '*',
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } as Record<string, string>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin, env.ALLOWED_ORIGIN) });
    }

    if (url.pathname !== '/analyze' || request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY não configurada.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    let payload: { contractText?: string; context?: string };
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGIN) } });
    }

    const { contractText, context } = payload;
    if (!contractText || typeof contractText !== 'string' || contractText.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Texto de contrato ausente ou muito curto.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGIN) } });
    }

    const prompt = buildPrompt(contractText, context);

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.2,
          response_mime_type: 'application/json',
          response_schema: analysisSchema
        }
      };

      const aiRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!aiRes.ok) {
        const msg = await aiRes.text();
        return new Response(JSON.stringify({ error: 'Falha na geração', details: msg }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGIN) } });
      }

      const aiJson: any = await aiRes.json();
      const text = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return new Response(JSON.stringify({ error: 'Resposta vazia do modelo' }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGIN) } });
      }

      // O modelo retorna string JSON; parse e devolvemos já como objeto para o cliente
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Falha ao parsear JSON gerado', raw: text }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGIN) } });
      }

      return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGIN) } });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: 'Erro interno', details: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGIN) } });
    }
  }
};
