import React from "react";
import * as firebase from "firebase";
import "firebase/auth";
import { Modal, ModalBody, ModalFooter, Button } from "reactstrap";
import { SIGN_IN_PROVIDERS } from "../../constants";
import { FirebaseAuth } from "react-firebaseui";

export enum ModalType {
  PRIVATE = "private",
  CREATE = "create",
  RESPOND = "respond"
}

function getModalMessageFor(type: ModalType): string {
  switch (type) {
    case ModalType.PRIVATE:
      return "If you do not sign in, you may not be able to view responses after closing your browser. Would you like to sign in now?";
    case ModalType.CREATE:
      return "If you do not sign in, you may not be able to edit or cancel this event after closing your browser. Would you like to sign in now?";
    case ModalType.RESPOND:
      return "If you do not sign in, you may not be able to change your response after closing your browser. Would you like to sign in now?";
    default:
      throw new Error();
  }
}

type TAction =
  | { type: "signInSuccessful" }
  | { type: "ceaseSignIn" }
  | { type: "signIn" }
  | { type: "goToHellYouStupidModal" }
  | { type: "ignoreSignInWarning" };

export interface ISignInModalState {
  signInPromptOpen: null | ModalType;
  signInModalOpen: boolean;
}

interface ISignInModalProps {
  state: ISignInModalState;
  dispatch: (action: TAction) => any;
}

const SignInModals: React.FC<ISignInModalProps> = ({ state, dispatch }) => {
  return (
    <>
      <Modal isOpen={state.signInPromptOpen !== null}>
        {state.signInPromptOpen !== null && (
          <>
            <ModalBody>{getModalMessageFor(state.signInPromptOpen!)}</ModalBody>
            <ModalFooter>
              <Button
                color="secondary"
                onClick={() => dispatch({ type: "goToHellYouStupidModal" })}
              >
                Cancel
              </Button>
              <Button
                color="danger"
                onClick={() => dispatch({ type: "ignoreSignInWarning" })}
              >
                Ignore
              </Button>
              <Button
                color="primary"
                onClick={() => dispatch({ type: "signIn" })}
              >
                Sign in
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      <Modal
        isOpen={state.signInModalOpen}
        toggle={() =>
          dispatch(
            state.signInModalOpen ? { type: "ceaseSignIn" } : { type: "signIn" }
          )
        }
      >
        <ModalBody>
          <FirebaseAuth
            uiConfig={{
              signInOptions: SIGN_IN_PROVIDERS,
              callbacks: {
                // Avoid redirects after sign-in.
                signInSuccessWithAuthResult: () => {
                  dispatch({ type: "signInSuccessful" });
                  return false;
                }
              },
              signInFlow: "popup",
              autoUpgradeAnonymousUsers: true
            }}
            firebaseAuth={firebase.auth()}
          />
        </ModalBody>
      </Modal>
    </>
  );
};

export default SignInModals;
