import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { VerificadorActualizacion } from "./components/VerificadorActualizacion";

createRoot(document.getElementById("root")!).render(
  <>
    <VerificadorActualizacion />
    <App />
  </>
);
