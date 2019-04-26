import React from "react";
import ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

const config = {
  apiKey: "AIzaSyAmBNjmbuSvj1zzAO19QfWEdDDw7XSzTto",
  authDomain: "whothefuckiscomingto.firebaseapp.com",
  databaseURL: "https://whothefuckiscomingto.firebaseio.com",
  projectId: "whothefuckiscomingto",
  storageBucket: "whothefuckiscomingto.appspot.com",
  messagingSenderId: "505919557672"
};
firebase.initializeApp(config);

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
