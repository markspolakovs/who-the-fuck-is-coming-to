import React from "react";
import * as firebase from "firebase/app";
import "firebase/auth";
import { Modal, ModalBody } from "reactstrap";
import { FirebaseAuth } from "react-firebaseui";
import { SIGN_IN_PROVIDERS } from "../../constants";

interface IProps {
  isOpen: boolean;
  setIsOpen?: (val: boolean) => any;
  onSuccess?: () => void;
  resolveMergeConflict?: (cred: firebase.auth.UserCredential) => Promise<void>;
}

const SignInModal: React.FC<IProps> = ({ isOpen, setIsOpen, onSuccess, resolveMergeConflict }) => (
  <Modal isOpen={isOpen} toggle={setIsOpen && (() => setIsOpen(!isOpen))}>
    <ModalBody>
      <FirebaseAuth
        uiConfig={{
          signInOptions: SIGN_IN_PROVIDERS,
          callbacks: {
            // Avoid redirects after sign-in.
            signInSuccessWithAuthResult: () => {
              if (setIsOpen) {
                setIsOpen(false);
              }
              if (onSuccess) {
                onSuccess();
              }
              return false;
            },
            signInFailure: async err => {
              if (err.code != "firebaseui/anonymous-upgrade-merge-conflict") {
                return Promise.resolve();
              }
              const user = firebase.auth().currentUser;
              if (resolveMergeConflict) {
                  await resolveMergeConflict(err.credential);
              } else {
                await firebase.auth().signInWithCredential(err.credential);
              }
              if (user) {
                await user.delete();
              }
              if (setIsOpen) {
                setIsOpen(false);
              }
              if (onSuccess) {
                onSuccess();
              }
            }
          },
          signInFlow: "popup",
          autoUpgradeAnonymousUsers: true
        }}
        firebaseAuth={firebase.auth()}
      />
    </ModalBody>
  </Modal>
);

export default SignInModal;
