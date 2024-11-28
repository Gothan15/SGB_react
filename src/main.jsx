import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "@material-tailwind/react";
import { ContainerProvider } from "brandi-react";
import { container } from "./Register";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ContainerProvider container={container}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ContainerProvider>
  </StrictMode>
);
