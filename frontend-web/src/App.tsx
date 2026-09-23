import { Routes, Route } from 'react-router-dom'

//components imports
import MapContainer from './components/MapContainer'

//page imports
import AuthPage from './pages/auth'

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
