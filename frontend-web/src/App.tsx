import MapContainer from './components/MapContainer'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

//page imports
import AuthPage from './pages/auth'
import MainMapPage from './pages/main-map'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainMapPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
