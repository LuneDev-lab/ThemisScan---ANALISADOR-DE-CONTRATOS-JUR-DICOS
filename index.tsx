import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('index.tsx inicializado');

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: sans-serif;">ERRO: Elemento #root não encontrado</div>';
  throw new Error("Could not find root element to mount to");
}

console.log('rootElement encontrado:', rootElement);

const root = ReactDOM.createRoot(rootElement);
console.log('React root criado');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('App renderizado');