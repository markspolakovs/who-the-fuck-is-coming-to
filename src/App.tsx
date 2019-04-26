import React, { useState } from "react";
import logo from "./logo.svg";
import * as firebase from "firebase";
import "firebase/auth";
import "./App.css";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { CreatePage } from "./pages/Create";
import { ViewPage } from "./pages/View";
import { FirebaseAuth } from "react-firebaseui";
import { SIGN_IN_PROVIDERS } from "./constants";
import Helmet from "react-helmet";
import { Button, Modal, ModalBody } from "reactstrap";
import SignInModal from "./components/SignInModals/SignInModal";

const App: React.FC = () => {
  const auth = useAuthState(firebase.auth());
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  return (
    <>
      <BrowserRouter>
        <div>
          <Switch>
            <Route exact path="/" component={CreatePage} />
            <Route path="/:id" component={ViewPage} />
            <Redirect exact from="" to="/" />
          </Switch>
          {auth.user ? (
            <Button color="link" onClick={() => firebase.auth().signOut()}>
              Sign out
            </Button>
          ) : (
            <Button color="link" onClick={() => setSignInModalOpen(true)}>
              Sign in
            </Button>
          )}
        </div>
      </BrowserRouter>
      <SignInModal isOpen={signInModalOpen} setIsOpen={newV => setSignInModalOpen(newV)} />
    </>
  );
};

export default App;
