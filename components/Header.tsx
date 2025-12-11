import React from 'react';
import { Scale, FileText } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-legal-600 p-2 rounded-lg text-white">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ThemisScan</h1>
            <p className="text-xs text-slate-500 font-medium">ANÁLISE JURÍDICA INTELIGENTE</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-4 text-sm font-medium text-slate-600">
          <div className="flex items-center space-x-1">
            <FileText size={16} />
            <span>Legislação Brasileira</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;