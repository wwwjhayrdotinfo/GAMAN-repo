import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PwaStatus from './components/PwaStatus.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PwaStatus />
    <App />
  </StrictMode>,
)
