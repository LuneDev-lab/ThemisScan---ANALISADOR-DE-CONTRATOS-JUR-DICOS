/**
 * Client-side service for contract analysis
 * 
 * This service calls the server-side API endpoint /api/analyze
 * to securely process contract analysis without exposing API keys in the browser.
 * 
 * CONFIGURATION:
 * - Ensure the server-side API endpoint has GENAI_API_KEY configured
 * - For local development: Set GENAI_API_KEY in .env.local
 * - For production (Vercel/Netlify): Set GENAI_API_KEY in environment variables
 */

import { AnalysisResponse } from "../types";

/**
 * Analyzes a contract by calling the server-side API endpoint
 * 
 * @param contractText - The contract text to analyze
 * @param context - Optional additional context provided by the user
 * @returns Promise resolving to the analysis response
 * @throws Error if the API call fails
 */
export const analyzeContract = async (contractText: string, context?: string): Promise<AnalysisResponse> => {
  try {
    // Call the server-side API endpoint
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

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Server error: ${response.status}`;
      throw new Error(errorMessage);
    }

    // Parse and return the analysis result
    const data: AnalysisResponse = await response.json();
    return data;

  } catch (error) {
    console.error("Error analyzing contract:", error);
    throw error;
  }
};