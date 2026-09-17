import MapContainer from './components/MapContainer'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

//page imports
import AuthPage from './pages/auth'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
      <section className="h-screen w-screen overflow-hidden">
        <MapContainer />
      </section>
    </>
  )
}

export default App
