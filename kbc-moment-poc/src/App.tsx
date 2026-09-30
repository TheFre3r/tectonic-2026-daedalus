import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ExplainPage } from './pages/ExplainPage'
import { CustomerAppPage } from './pages/CustomerAppPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ExplainPage />} />
        <Route path="/app" element={<CustomerAppPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
