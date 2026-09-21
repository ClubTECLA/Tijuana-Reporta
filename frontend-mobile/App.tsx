import { StatusBar } from 'expo-status-bar';
import { PerfilScreen } from './src/screens/PerfilScreen';

export default function App() {
  return (
    <>
      <PerfilScreen />
      <StatusBar style="dark" />
    </>
  );
}