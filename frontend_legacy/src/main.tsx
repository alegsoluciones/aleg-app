import React from 'react'
import ReactDOM from 'react-dom/client'
import { Buffer } from 'buffer';

// Polyfill Buffer for the browser (required for react-pdf)
(globalThis as any).Buffer = Buffer;

import App from './App'
import './App.css'



ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
