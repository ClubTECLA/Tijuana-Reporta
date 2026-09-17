import MapContainer from './components/MapContainer'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

//page imports
import AuthPage from './pages/auth'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MapContainer />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
