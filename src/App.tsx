import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { Dashboard } from "./pages/Dashboard.tsx";
import { Videos } from "./pages/Videos.tsx";
import { MainLayout } from "./layouts/MainLayout.tsx";

function App() {

  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />} >
            <Route index element={<Dashboard />} />
            <Route path="videos" element={<Videos />} />
          </Route>
        </Routes>
      </BrowserRouter>
  )
}

export default App
