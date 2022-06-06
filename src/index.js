import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./routes/login";
import Registratie from "./routes/registratie";
import Profiel from "./routes/profiel";
import DemoDrop from "./routes/demodrop";
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <React.StrictMode>
      <BrowserRouter>
          <Routes>
              <Route path="/" element={<App />}>
                  <Route path="Login" element={<Login />} />
                  <Route path="Registratie" element={<Registratie />} />
                  <Route path="Profiel" element={<Profiel />} />
                  <Route path="DemoDrop" element={<DemoDrop />} />
              </Route>
          </Routes>
      </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
