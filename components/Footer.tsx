import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <p className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} ThemisScan. Desenvolvido para agilizar análises contratuais.
        </p>
        <p className="text-slate-400 text-xs mt-2 max-w-2xl mx-auto">
          AVISO LEGAL: Esta ferramenta utiliza inteligência artificial para fornecer uma análise preliminar. 
          Os resultados podem conter imprecisões. Sempre consulte um advogado inscrito na OAB antes de assinar qualquer documento.
        </p>
      </div>
    </footer>
  );
};

export default Footer;