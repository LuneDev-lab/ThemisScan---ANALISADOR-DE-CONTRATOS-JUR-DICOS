import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import InputSection from './components/InputSection';
import AnalysisResult from './components/AnalysisResult';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AnalysisResponse, AnalysisStatus } from './types';
import { analyzeContract } from './services/geminiService';
import { AlertTriangle, Info } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (text: string, context: string) => {
    setStatus(AnalysisStatus.ANALYZING);
    setError(null);
    try {
      const data = await analyzeContract(text, context);
      setResult(data);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err) {
      const errorObj = err as Error;
      const errorMessage = errorObj?.message || 'Erro desconhecido';
      console.error('[App] Análise falhou:', errorMessage);
      setError(errorMessage);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStatus(AnalysisStatus.IDLE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col font-sans bg-slate-50">
        <Header />

        <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {status === AnalysisStatus.IDLE && (
            <InputSection onAnalyze={handleAnalyze} isLoading={false} />
          )}

          {status === AnalysisStatus.ANALYZING && (
            <InputSection onAnalyze={handleAnalyze} isLoading={true} />
          )}

          {status === AnalysisStatus.ERROR && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-red-800">Erro na Análise</h3>
                    <p className="text-red-600 mt-1">{error}</p>

                    <div className="mt-4 bg-white rounded p-4 text-sm text-slate-600 space-y-2">
                      <p className="font-semibold text-slate-700">Sugestões:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Verifique a chave de API (VITE_GEMINI_API_KEY) em <code className="bg-slate-100 px-1">.env.local</code></li>
                        <li>Se usar backend, configure <code className="bg-slate-100 px-1">VITE_USE_BACKEND=true</code> e GEMINI_API_KEY no servidor</li>
                        <li>Abra o console (F12) para mais detalhes técnicos</li>
                        <li>Verifique sua conexão de internet e a conectividade com a API Gemini</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => setStatus(AnalysisStatus.IDLE)}
                      className="mt-4 text-red-700 font-medium underline hover:text-red-900 transition"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === AnalysisStatus.COMPLETED && result && (
            <AnalysisResult data={result} onReset={handleReset} />
          )}
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default App;