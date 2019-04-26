import React from "react";
import logo from "./logo.svg";
import * as firebase from "firebase";
import "firebase/auth";
import "./App.css";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { CreatePage } from "./pages/Create";
import { ViewPage } from "./pages/View";
import { FirebaseAuth } from "react-firebaseui";
import { SIGN_IN_PROVIDERS } from "./constants";
import Helmet from "react-helmet";

const App: React.FC = () => {
  const auth = useAuthState(firebase.auth());
  return (
    <>
      <BrowserRouter>
        <div>
          <Switch>
            <Route exact path="/" component={CreatePage} />
            <Route path="/:id" component={ViewPage} />
          </Switch>
          {auth.user && (
            <a href="#" onClick={() => firebase.auth().signOut()}>
              Sign out
            </a>
          )}
        </div>
      </BrowserRouter>
      <Helmet>
        <title>Who the fuck is coming to...</title>
      </Helmet>
    </>
  );
};

export default App;
