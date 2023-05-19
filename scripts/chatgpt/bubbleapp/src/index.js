import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
//note: non-stacked genre bubbles w/ sizes
//import App from './App.v5.jsx';
//stacked bubble chart, w/ inner bubbles = artists
import App from './App.v6.jsx';

 // import App from './App.v7.jsx';
// import App from './routeData/App.route';
//import App from './App.v8.jsx';
//note: network graph of large genre nodes linked to artists
//import App from './App.v9.jsx';
//import App from './App.v10.jsx';
import reportWebVitals from './reportWebVitals';



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
