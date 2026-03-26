import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./components/Home.jsx";
import FixtureDetail from "./components/FixtureDetail.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fixture/:id" element={<FixtureDetail />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
