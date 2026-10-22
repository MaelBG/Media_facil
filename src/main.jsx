import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { appConfig } from './config/appConfig.js'
import ConfigurationError from './components/ConfigurationError.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {appConfig.valid ? <App /> : <ConfigurationError />}
  </StrictMode>,
)
