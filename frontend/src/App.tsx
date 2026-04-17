import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./layout/AppShell";
import Overview from "./pages/Overview";
import EvalPage from "./pages/EvalPage";
import JudgePage from "./pages/JudgePage";
import AdversarialPage from "./pages/AdversarialPage";
import RagPage from "./pages/RagPage";
import BiasPage from "./pages/BiasPage";
import ConsistencyPage from "./pages/ConsistencyPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Overview />} />
          <Route path="/eval" element={<EvalPage />} />
          <Route path="/judge" element={<JudgePage />} />
          <Route path="/adversarial" element={<AdversarialPage />} />
          <Route path="/rag" element={<RagPage />} />
          <Route path="/bias" element={<BiasPage />} />
          <Route path="/consistency" element={<ConsistencyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
