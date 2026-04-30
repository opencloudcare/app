import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './app.tsx'
import {TooltipProvider} from "@/components/ui/tooltip.tsx";
import {ThemeProvider} from "@/components/ui/theme-provider.tsx";
import {Toaster} from "sonner";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster richColors />
      <TooltipProvider>
        <App/>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
