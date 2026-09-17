import MapContainer from './components/MapContainer'
import ReportButtomSheet from './components/ReportButtomSheet'
import './App.css'

function App() {

  return (
    <>
      <section id="map-container">
        <MapContainer />
        <ReportButtomSheet isVisible={true} onClose={() => {}} />
      </section>
    </>
  )
}

export default App
