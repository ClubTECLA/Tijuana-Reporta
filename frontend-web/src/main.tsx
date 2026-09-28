import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './hooks/contexts/AuthContext.tsx'
import { SysMessageProvider } from './hooks/contexts/SysMessageContext.tsx'
import NavigationWrapper from './components/NavigationWrapper.tsx'
import { BrowserRouter } from 'react-router-dom'
import { CommonPanelProvider } from './hooks/contexts/CommonPanelContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SysMessageProvider>
      <AuthProvider>
        <BrowserRouter>
          <CommonPanelProvider>
            <NavigationWrapper />
            <App />
          </CommonPanelProvider>
        </BrowserRouter>
      </AuthProvider>
    </SysMessageProvider>
  </StrictMode>,
)
