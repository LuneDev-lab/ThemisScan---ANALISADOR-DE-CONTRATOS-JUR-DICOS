import React, { useState, useRef } from 'react';
import { Upload, FileText, Search, Loader2 } from 'lucide-react';
// @ts-ignore
import mammoth from 'mammoth';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

interface InputSectionProps {
  onAnalyze: (text: string, context: string) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isLoading }) => {
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize PDF worker
  React.useEffect(() => {
    // Configure PDF.js worker
    const lib = (pdfjsLib as any).default || pdfjsLib;
    if (lib && lib.GlobalWorkerOptions) {
      // Use a more reliable CDN worker source and set it synchronously
      lib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      console.log('PDF workerSrc configured:', lib.GlobalWorkerOptions.workerSrc);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsReadingFile(true);

    try {
      if (file.name.toLowerCase().endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            setText(result.value);
          } catch (error) {
            console.error("Error reading Word file:", error);
            alert("Erro ao processar o arquivo Word. Certifique-se de que é um .docx válido.");
          } finally {
            setIsReadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          try {
            console.log('Starting PDF processing...');
            const lib = pdfjsLib.default || pdfjsLib;
            console.log('PDF.js library loaded:', !!lib);

            if (!lib) {
              throw new Error('PDF.js library not loaded');
            }

            // Ensure workerSrc is set; use CDN worker if not
            if (lib && lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
              lib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
            }

            console.log('Creating PDF document...');
            const loadingTask = lib.getDocument({ data: arrayBuffer });

            const pdf = await loadingTask.promise;
            console.log('PDF loaded successfully. Pages:', pdf.numPages);
            
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              console.log(`Processing page ${i}/${pdf.numPages}`);
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              // @ts-ignore
              const pageText = textContent.items.map(item => item.str).join(' ');
              fullText += pageText + '\n\n';
            }
            console.log('PDF text extraction completed. Length:', fullText.length);
            setText(fullText);
          } catch (error) {
            console.error("Error reading PDF file:", error);
            console.error("Error details:", {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
            alert(`Erro ao processar o arquivo PDF: ${error.message}`);
          } finally {
            setIsReadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Txt ou Markdown
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setText(content);
          setIsReadingFile(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao ler o arquivo.");
      setIsReadingFile(false);
    }
  };

  const handleSampleLoad = () => {
    const sample = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING

ENTRE:
CLIENTE: Empresa X Ltda...
CONTRATADA: Agência Y...

CLÁUSULA 3 - PAGAMENTO
O CLIENTE pagará R$ 5.000,00 mensais. Em caso de atraso, multa de 100% sobre o valor.

CLÁUSULA 7 - RESCISÃO
A CONTRATADA pode rescindir este contrato a qualquer momento sem aviso prévio. O CLIENTE deve dar aviso prévio de 180 dias.

CLÁUSULA 9 - FORO
Fica eleito o foro da Comarca de Nova Iorque, EUA, para dirimir quaisquer dúvidas.`;
    setText(sample);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Análise de Contrato em Segundos</h2>
        <p className="text-slate-600 max-w-lg mx-auto">
          Cole o texto do seu contrato abaixo ou faça upload de um arquivo para identificar riscos, cláusulas abusivas e termos faltantes com base na legislação brasileira.
        </p>
      </div>

      {/* Main Input Area */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-semibold text-slate-700">
            Texto do Contrato
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleSampleLoad}
              className="text-xs text-legal-600 hover:text-legal-800 font-medium underline decoration-dotted"
            >
              Carregar Exemplo
            </button>
            <span className="text-slate-300">|</span>
             <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isReadingFile || isLoading}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center space-x-1 disabled:opacity-50"
            >
              {isReadingFile ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              <span>Carregar Arquivo (Word/PDF)</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".txt,.md,.docx,.pdf" 
              onChange={handleFileChange} 
            />
          </div>
        </div>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isReadingFile ? "Lendo arquivo..." : "Cole o texto do contrato aqui..."}
          disabled={isReadingFile || isLoading}
          className={`w-full h-64 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-legal-500 focus:border-transparent resize-y font-mono text-sm leading-relaxed text-slate-700 mb-4 ${
            isReadingFile ? 'bg-slate-50' : ''
          }`}
        />

        <div className="mb-6">
           <label className="block text-sm font-semibold text-slate-700 mb-2">
            Contexto Adicional (Opcional)
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={isLoading}
            placeholder="Ex: Sou freelancer de design, preocupado com direitos autorais..."
            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-legal-500 focus:border-transparent text-sm text-slate-700"
          />
        </div>

        <button
          onClick={() => onAnalyze(text, context)}
          disabled={!text.trim() || isLoading || isReadingFile}
          className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg flex items-center justify-center space-x-3 transition-all transform active:scale-[0.99] ${
            !text.trim() || isLoading || isReadingFile
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-legal-600 hover:bg-legal-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Analisando Juridicamente...</span>
            </>
          ) : (
            <>
              <Search size={20} />
              <span>Analisar Contrato Agora</span>
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-400 mt-4">
          A análise é gerada por um Software e não substitui consultoria jurídica profissional.
        </p>
      </div>

    </div>
  );
};

export default InputSection;