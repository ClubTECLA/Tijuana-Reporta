import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './hooks/contexts/AuthContext.tsx'
import { SysMessageProvider } from './hooks/contexts/SysMessageContext.tsx'
import NavigationWrapper from './components/NavigationWrapper.tsx'
import { BrowserRouter } from 'react-router-dom'
import { CommonPanelProvider } from './hooks/contexts/CommonPanelContext.tsx'
import { ModalOverlay, ModalsProvider } from './hooks/contexts/CommonModalContext.tsx'
import { MapProvider } from './hooks/contexts/MapContext.tsx'
import { ReportesProvider } from './hooks/contexts/ReportesContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SysMessageProvider>
      <AuthProvider>
        <BrowserRouter>
          <ModalsProvider>
            <MapProvider>
              <ReportesProvider>
                <CommonPanelProvider>
                  <ModalOverlay />
                  <NavigationWrapper />
                  <App />
                </CommonPanelProvider>
              </ReportesProvider>
            </MapProvider>
          </ModalsProvider>
        </BrowserRouter>
      </AuthProvider>
    </SysMessageProvider>
  </StrictMode>,
)
