import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { applySavedTheme, watchSystemTheme } from './hooks/useThemeColors.js'
import './styles/tokens.css'
import './styles/index.css'
import './styles/prisma.css'
import ScrollManager from './components/ScrollManager.jsx'
import PageTransition from './components/PageTransition.jsx'
import ToastContainer from './components/ToastContainer.jsx'
import Landing from './pages/Landing.jsx'
import Agenda from './pages/Agenda.jsx'
import Payment from './pages/Payment.jsx'
import PagoCanje from './pages/PagoCanje.jsx'
import PagoMembresia from './pages/PagoMembresia.jsx'
import ConfirmacionPago from './pages/ConfirmacionPago.jsx'
import CerrarVentana from './pages/CerrarVentana.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MiCuenta from './pages/MiCuenta.jsx'

applySavedTheme()
watchSystemTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollManager />
      <PageTransition />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/pago/:bookingId/exito" element={<ConfirmacionPago />} />
        <Route path="/pago/canje/:pagoId" element={<PagoCanje />} />
        <Route path="/pago/membresia/:pagoId" element={<PagoMembresia />} />
        <Route path="/pago/:bookingId" element={<Payment />} />
        <Route path="/cerrar" element={<CerrarVentana />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mi-cuenta" element={<MiCuenta />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)