import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import InputSection from './components/InputSection';
import AnalysisResult from './components/AnalysisResult';
import { AnalysisResponse, AnalysisStatus } from './types';
import { analyzeContract } from './services/geminiService';
import { AlertTriangle } from 'lucide-react';

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
      console.error(err);
      const errorObj = err as Error;
      setError(errorObj?.message || "Não foi possível completar a análise. Verifique sua chave de API ou tente novamente.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStatus(AnalysisStatus.IDLE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
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
             <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-red-800">Erro na Análise</h3>
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={() => setStatus(AnalysisStatus.IDLE)}
                  className="text-red-700 font-medium underline hover:text-red-900"
                >
                  Tentar Novamente
                </button>
             </div>
          </div>
        )}

        {status === AnalysisStatus.COMPLETED && result && (
          <AnalysisResult data={result} onReset={handleReset} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;