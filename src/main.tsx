import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './app.tsx'
import {TooltipProvider} from "@/components/ui/tooltip.tsx";
import {ThemeProvider} from "@/components/ui/theme-provider.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <App/>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
