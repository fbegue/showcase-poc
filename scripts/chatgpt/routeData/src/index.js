import { StrictMode } from "react";
import ReactDOM from "react-dom";

 import App from "./App";
//import App from "./App.v7.jsx";
const rootElement = document.getElementById("root");
ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  rootElement
);
