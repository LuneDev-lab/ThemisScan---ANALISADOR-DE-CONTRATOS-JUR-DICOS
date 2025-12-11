/**
 * Client-side wrapper for contract analysis API
 * 
 * This module provides a frontend interface to the server-side analysis API.
 * No API keys are exposed in the client bundle.
 * 
 * The actual AI analysis happens server-side at /api/analyze
 */

import { AnalysisResponse } from "../types";

/**
 * Analyzes a contract by sending it to the server-side API endpoint
 * 
 * @param contractText - The contract text to analyze
 * @param context - Optional additional context provided by the user
 * @returns Promise with the analysis response
 * @throws Error if the API request fails
 */
export const analyzeContract = async (contractText: string, context?: string): Promise<AnalysisResponse> => {
  try {
    // Note: API routes are served from root, not under the base path configured in vite.config.ts
    // This is standard behavior for Vercel/Netlify serverless functions
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractText,
        context,
      }),
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = 'Falha ao analisar o contrato';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json() as AnalysisResponse;
    return data;

  } catch (error) {
    console.error("Error analyzing contract:", error);
    throw error;
  }
};