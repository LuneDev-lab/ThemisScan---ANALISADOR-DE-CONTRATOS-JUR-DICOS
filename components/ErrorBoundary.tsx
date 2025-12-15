import React, { ReactNode, ReactElement } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log de erro para depuração
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Reload a página para limpar o estado da aplicação
    window.location.href = '/';
  };

  render(): ReactElement {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-red-800 mb-2">
              Algo deu errado
            </h1>

            <p className="text-center text-slate-600 mb-6">
              A aplicação encontrou um erro inesperado. Tente recarregar a página ou
              verifique o console do navegador para mais detalhes.
            </p>

            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                <p className="text-sm font-mono text-red-700 break-words">
                  <span className="font-bold">Erro:</span> {this.state.error.toString()}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-4 text-xs">
                    <summary className="cursor-pointer font-semibold text-red-600">
                      Stack de componentes (dev only)
                    </summary>
                    <pre className="mt-2 overflow-auto bg-white p-2 rounded border border-red-200 text-red-700">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                <RefreshCw size={18} />
                Tentar Novamente
              </button>
            </div>

            <p className="text-center text-slate-500 text-sm mt-6">
              Se o problema persistir, tente abrir o{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded">
                DevTools (F12)
              </code>{' '}
              e verifique a aba Console para mais informações.
            </p>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
