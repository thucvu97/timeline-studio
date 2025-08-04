import { Buffer } from 'buffer'
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter, Route, Routes } from "react-router-dom"
import "./index.css"
import App from "./App"

// Полифилл Buffer для браузера
window.Buffer = Buffer
import { ScrollToTop } from "./components/ScrollToTop"
import About from "./pages/About"
import Blog from "./pages/Blog"
import BlogPost from "./pages/BlogPost"
import Changelog from "./pages/Changelog"
import Docs from "./pages/Docs"
import FAQ from "./pages/FAQ"
import Logo3D from "./pages/Logo3D"
import Pricing from "./pages/Pricing"
import Privacy from "./pages/Privacy"
import ResponsibleAI from "./pages/ResponsibleAI"
import Terms from "./pages/Terms"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <ScrollToTop />
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
        <Route path="/faq" element={<FAQ />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/logo3d" element={<Logo3D />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
