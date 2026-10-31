import { Routes, Route } from 'react-router-dom'

//components imports
import MapContainer from '@/features/mapa/MapContainer'

//page imports
import AuthPage from '@/features/sesion/views/AuthPage'

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<MapContainer />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </>
  )
}

export default App
