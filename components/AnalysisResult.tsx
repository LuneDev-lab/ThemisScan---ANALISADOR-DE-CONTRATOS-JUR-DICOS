import React from 'react';
import { AnalysisResponse } from '../types';
import { AlertTriangle, CheckCircle, HelpCircle, ShieldAlert, FileText, Lightbulb, AlertCircle, Download } from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';

interface AnalysisResultProps {
  data: AnalysisResponse;
  onReset: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, onReset }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'ALTO': return 'bg-red-100 text-red-800 border-red-200';
      case 'MÉDIO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAIXO': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let cursorY = 20;

    const printText = (text: string, fontSize: number, options: { font?: string, style?: string, color?: string | [number, number, number] } = {}) => {
      doc.setFontSize(fontSize);
      // @ts-ignore
      doc.setFont(options.font || 'helvetica', options.style || 'normal');
      
      if (Array.isArray(options.color)) {
        doc.setTextColor(options.color[0], options.color[1], options.color[2]);
      } else if (options.color === 'red') {
        doc.setTextColor(220, 38, 38);
      } else if (options.color === 'blue') {
        doc.setTextColor(2, 132, 199); // legal-600
      } else if (options.color === 'gray') {
        doc.setTextColor(100, 116, 139);
      } else {
        doc.setTextColor(0, 0, 0);
      }

      const lines = doc.splitTextToSize(text, contentWidth);
      const lineHeight = fontSize * 0.4; // approximate px to mm conversion factor for simple usage

      if (cursorY + (lines.length * lineHeight) > pageHeight - margin) {
        doc.addPage();
        cursorY = 20;
      }

      doc.text(lines, margin, cursorY);
      cursorY += (lines.length * lineHeight) + 6;
    };

    // Header
    printText("ThemisScan - Relatório de Análise", 18, { style: 'bold', color: 'blue' });
    printText(`Data da Análise: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 10, { color: 'gray' });
    cursorY += 5;

    // Summary
    printText("Resumo Executivo", 14, { style: 'bold' });
    printText(`Risco Global: ${data.riskLevel}`, 12, { style: 'bold', color: data.riskLevel === 'ALTO' ? 'red' : undefined });
    printText(data.executiveSummary, 11);
    printText(`Tipo de Contrato: ${data.contractType}`, 10, { style: 'italic', color: 'gray' });
    cursorY += 5;

    // Risks
    if (data.riskClauses.length > 0) {
      printText("Cláusulas de Risco (Prioridade Alta)", 14, { style: 'bold', color: 'red' });
      data.riskClauses.forEach(risk => {
        printText(`• ${risk.clause}`, 11, { style: 'bold' });
        printText(`  Problema: ${risk.reason}`, 10);
        printText(`  Recomendação: ${risk.recommendation}`, 10);
        cursorY += 2;
      });
      cursorY += 5;
    } else {
      printText("Nenhuma cláusula de alto risco detectada.", 11, { color: 'gray' });
      cursorY += 5;
    }

    // Missing Terms
    if (data.missingTerms.length > 0) {
      printText("Termos Faltantes", 14, { style: 'bold' });
      data.missingTerms.forEach(term => {
        printText(`• ${term}`, 10);
      });
      cursorY += 5;
    }

    // Recommendations
    printText("Plano de Ação", 14, { style: 'bold' });
    data.practicalRecommendations.forEach((rec, idx) => {
      printText(`${idx + 1}. ${rec}`, 10);
    });

    doc.save(`ThemisScan_Analise_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      
      {/* Executive Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <FileText className="text-slate-500" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Resumo Executivo</h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(data.riskLevel)}`}>
            RISCO: {data.riskLevel}
          </span>
        </div>
        <div className="p-6">
          <p className="text-slate-700 leading-relaxed mb-4">{data.executiveSummary}</p>
          <div className="text-sm text-slate-500 font-medium">
            Tipo Identificado: <span className="text-slate-900">{data.contractType}</span>
          </div>
        </div>
      </div>

      {/* High Priority Risks */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-red-700 mb-2">
          <ShieldAlert size={24} />
          <h2 className="text-xl font-bold">Cláusulas de Risco (Prioridade Alta)</h2>
        </div>
        
        {data.riskClauses.length === 0 ? (
          <div className="bg-green-50 p-6 rounded-lg border border-green-100 text-green-800 flex items-center space-x-3">
             <CheckCircle size={20} />
             <span>Nenhuma cláusula crítica de alto risco detectada.</span>
          </div>
        ) : (
          <div className="grid gap-4">
            {data.riskClauses.map((risk, idx) => (
              <div key={idx} className="bg-white rounded-lg border-l-4 border-l-red-500 border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                   <h3 className="font-semibold text-red-700 pr-4">⚠️ {risk.clause}</h3>
                </div>
                <div className="space-y-3 text-sm">
                   <div className="bg-red-50 p-3 rounded text-red-900">
                     <span className="font-bold block text-xs uppercase tracking-wider text-red-500 mb-1">O Problema</span>
                     {risk.reason}
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div>
                        <span className="font-bold block text-xs uppercase tracking-wider text-slate-500 mb-1">Impacto</span>
                        <p className="text-slate-700">{risk.impact}</p>
                     </div>
                     <div>
                        <span className="font-bold block text-xs uppercase tracking-wider text-legal-600 mb-1">Recomendação</span>
                        <p className="text-slate-700">{risk.recommendation}</p>
                     </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missing Terms */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-amber-600 mb-2">
          <AlertCircle size={24} />
          <h2 className="text-xl font-bold">Termos Faltantes Importantes</h2>
        </div>
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
           {data.missingTerms.length === 0 ? (
             <p className="text-amber-800">O contrato parece cobrir todos os termos essenciais padrão.</p>
           ) : (
             <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {data.missingTerms.map((term, idx) => (
                 <li key={idx} className="flex items-start space-x-2 text-amber-900">
                   <AlertTriangle size={16} className="mt-1 flex-shrink-0 text-amber-500" />
                   <span>{term}</span>
                 </li>
               ))}
             </ul>
           )}
        </div>
      </div>

      {/* Favorable Terms */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-green-700 mb-2">
          <CheckCircle size={24} />
          <h2 className="text-xl font-bold">Termos Favoráveis</h2>
        </div>
        <div className="grid gap-3">
            {data.favorableTerms.map((term, idx) => (
              <div key={idx} className="bg-white border border-green-100 rounded-lg p-4 shadow-sm flex items-start space-x-3">
                <div className="bg-green-100 p-1.5 rounded-full text-green-600 mt-0.5">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{term.clause}</h4>
                  <p className="text-sm text-slate-600 mt-1">{term.benefit}</p>
                </div>
              </div>
            ))}
            {data.favorableTerms.length === 0 && (
              <p className="text-slate-500 italic">Nenhum termo excepcionalmente favorável destacado.</p>
            )}
        </div>
      </div>

      {/* Recommendations & Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Actions */}
        <div className="bg-slate-800 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="text-yellow-400" size={24} />
            <h3 className="text-lg font-bold">Plano de Ação</h3>
          </div>
          <ul className="space-y-4">
            {data.practicalRecommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start space-x-3">
                <span className="bg-slate-600 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-slate-200 text-sm leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Questions */}
        {data.clientQuestions.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
             <div className="flex items-center space-x-2 mb-4 text-legal-600">
              <HelpCircle size={24} />
              <h3 className="text-lg font-bold">Perguntas de Contexto</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Considere esclarecer estes pontos para uma análise mais precisa:</p>
            <ul className="space-y-3">
              {data.clientQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-slate-700 text-sm">
                  <span className="text-legal-400">•</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-center space-x-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <button 
          onClick={onReset}
          className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 shadow-sm"
        >
          <FileText size={18} />
          <span>Novo Contrato</span>
        </button>
        <button 
          onClick={generatePDF}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Download size={18} />
          <span>Baixar Relatório PDF</span>
        </button>
      </div>

    </div>
  );
};

export default AnalysisResult;