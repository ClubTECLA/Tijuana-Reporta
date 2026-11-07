import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { AuthProvider } from './features/sesion/AuthProvider.tsx'
import { SysMessageProvider } from './components/ui/SysMessageContext.tsx'
import NavigationWrapper from './app/NavigationWrapper.tsx'
import { BrowserRouter } from 'react-router-dom'
import { CommonPanelProvider } from './panels/CommonPanelProvider.tsx'
import { ModalsProvider } from './panels/ModalsProvider.tsx'
import ModalChrome from './panels/ModalChrome.tsx'
import { MapProvider } from './features/mapa/MapProvider.tsx'
import { LocationPickerProvider } from './features/mapa/useLocationPicker.ts'
import { ReportesProvider } from './features/reportes/ReportesProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SysMessageProvider>
      <AuthProvider>
        <BrowserRouter>
          <ModalsProvider>
            <MapProvider>
              <LocationPickerProvider>
                <ReportesProvider>
                  <CommonPanelProvider>
                    {/* Chrome vive en el nivel raíz para superponerse al contenido de navegación. */}
                    <ModalChrome />
                    <NavigationWrapper />
                    <App />
                  </CommonPanelProvider>
                </ReportesProvider>
              </LocationPickerProvider>
            </MapProvider>
          </ModalsProvider>
        </BrowserRouter>
      </AuthProvider>
    </SysMessageProvider>
  </StrictMode>,
)
