import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import "./index.css"
import App from "./App"
import About from './pages/About'
import Changelog from './pages/Changelog'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Pricing from './pages/Pricing'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import ResponsibleAI from './pages/ResponsibleAI'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/responsible-ai" element={<ResponsibleAI />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
