<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ThemisScan - Analisador de Contratos Jurídicos

AI-powered contract analysis tool for Brazilian legal documents.

View your app in AI Studio: https://ai.studio/apps/drive/1af_MJh5QGKJ5Z8WFYHPkHW7pXlaI4vG5

## Architecture

This application uses a **serverless architecture** to securely handle AI API calls:

- **Frontend**: React + Vite application (client-side)
- **Backend**: Serverless API function at `/api/analyze` (server-side)
- **AI Provider**: Google Gemini AI (gemini-2.5-flash model)

The API key is **never exposed** to the client bundle and remains secure on the server.

## Environment Variables

**Required for deployment:**

- `GENAI_API_KEY`: Your Google Gemini API key

**DO NOT** commit your API key to the repository. Set it in your hosting platform's environment variables.

## Local Development

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root:
   ```bash
   GENAI_API_KEY=your_google_gemini_api_key_here
   ```

3. Install Vercel CLI for local serverless function testing:
   ```bash
   npm install -g vercel
   ```

4. Run the development server with Vercel:
   ```bash
   vercel dev
   ```
   
   This will start both the Vite dev server and the serverless API function locally.

   **Alternative (Frontend only):**
   ```bash
   npm run dev
   ```
   Note: The API endpoint won't work without Vercel CLI in local development.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variable in Project Settings:
   - Name: `GENAI_API_KEY`
   - Value: Your Google Gemini API key
4. Deploy!

Vercel automatically detects the `api/` folder and deploys functions as serverless endpoints.

### Netlify

1. Push your code to GitHub
2. Import the project in [Netlify](https://netlify.com)
3. Add environment variable in Site Settings > Environment Variables:
   - Key: `GENAI_API_KEY`
   - Value: Your Google Gemini API key
4. Deploy!

Netlify automatically detects serverless functions in the `api/` folder.

## How It Works

1. User inputs contract text in the frontend
2. Frontend sends POST request to `/api/analyze` with contract text
3. Serverless function (server-side) reads `GENAI_API_KEY` from environment
4. Server calls Google Gemini AI for analysis
5. Server returns parsed JSON analysis to frontend
6. Frontend displays the analysis results

**Security**: The API key never leaves the server and is never bundled with the client code.

## Getting Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your environment variables

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Backend**: Serverless Functions (Vercel/Netlify compatible)
- **AI**: Google Gemini AI (@google/genai)
- **PDF Processing**: jspdf, pdfjs-dist, mammoth

