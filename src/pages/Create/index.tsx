import React, { useState, useReducer, useEffect } from "react";
import * as firebase from "firebase/app";
import "firebase/auth";
import {
  Input,
  Card,
  CardBody,
  InputGroup,
  InputGroupText,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  Container,
  Spinner,
  Fade,
  InputGroupAddon,
  Alert
} from "reactstrap";
import { FirebaseAuth, Props as FireUIProps } from "react-firebaseui";
import { useAuthState } from "react-firebase-hooks/auth";
import { IEventOptions, DefaultEventOptions, IEvent } from "../../types";
import { waitForAuth } from "../../util/auth";
import { slugify } from "../../util/slugify";
import useRouter from "../../util/useRouter";
import { logAction } from "../../util/log";
import { SIGN_IN_PROVIDERS } from "../../constants";
import SignInModals, {
  ModalType,
  ISignInModalState
} from "../../components/SignInModals";

type IAction =
  | { type: "private"; value: boolean }
  | { type: "goToHellYouStupidModal" }
  | { type: "ignoreSignInWarning" }
  | { type: "signIn" }
  | { type: "ceaseSignIn" }
  | { type: "signInSuccessful" }
  | { type: "requestSignInForCreate" }
  | { type: "creating" }
  | { type: "setName"; name: string }
  | { type: "setSlug"; slug: string }
  | { type: "alreadyExists" }
  | { type: "createdSuccessfully" }
  | { type: "creationError"; err: any };
interface IOurState extends ISignInModalState {
  eventOptions: IEventOptions;
  signInPromptOpen: ModalType | null;
  signInModalOpen: boolean;
  createAsAnonymous: boolean;
  creating: boolean;
  name: string;
  slug: string;
  slugTouched: boolean;
  alreadyExists: boolean;
  createdSuccessfully: boolean;
  creationError: any | null;
}
const initialState: IOurState = {
  eventOptions: DefaultEventOptions,
  signInPromptOpen: null,
  signInModalOpen: false,
  createAsAnonymous: false,
  creating: false,
  name: "",
  slug: "",
  slugTouched: false,
  alreadyExists: false,
  createdSuccessfully: false,
  creationError: null
};

export const CreatePage: React.FC = () => {
  const authState = useAuthState(firebase.auth());
  const router = useRouter();

  function reducer(state: IOurState, action: IAction): IOurState {
    logAction(action);
    switch (action.type) {
      case "setName":
        const s: IOurState = { ...state, name: action.name };
        if (!state.slugTouched) {
          s.slug = slugify(s.name);
        }
        return s;
      case "setSlug":
        return {
          ...state,
          slug: action.slug,
          slugTouched: true
        };
      case "private":
        if (state.eventOptions.private || authState.user) {
          return {
            ...state,
            eventOptions: { ...state.eventOptions, private: action.value }
          };
        } else {
          return {
            ...state,
            signInPromptOpen: ModalType.PRIVATE
          };
        }
      case "creating":
        return { ...state, creating: true, alreadyExists: false };
      case "createdSuccessfully":
        return { ...state, creating: false, createdSuccessfully: true };
      case "creationError":
        return { ...state, creating: false, creationError: action.err };
      case "requestSignInForCreate":
        return {
          ...state,
          creating: false,
          signInPromptOpen: ModalType.CREATE
        };
      case "signIn":
        return { ...state, signInModalOpen: true };
      case "ceaseSignIn":
        return { ...state, signInModalOpen: false };
      case "alreadyExists":
        return { ...state, alreadyExists: true };
      case "signInSuccessful":
        switch (state.signInPromptOpen) {
          case ModalType.PRIVATE:
            return {
              ...state,
              signInPromptOpen: null,
              signInModalOpen: false,
              eventOptions: {
                ...state.eventOptions,
                private: true
              }
            };
        }
      case "ignoreSignInWarning":
        switch (state.signInPromptOpen) {
          case ModalType.PRIVATE:
            return {
              ...state,
              signInPromptOpen: null,
              eventOptions: {
                ...state.eventOptions,
                private: true
              }
            };
          case ModalType.CREATE:
            return {
              ...state,
              signInPromptOpen: null,
              createAsAnonymous: true,
              creating: true
            };
        }
      case "goToHellYouStupidModal":
        return { ...state, signInPromptOpen: null };
      default:
        throw new Error();
    }
  }
  const [state, dispatch] = useReducer(reducer, initialState);

  async function create() {
    try {
      dispatch({ type: "creating" });
      if (authState.initialising) {
        await waitForAuth();
      }
      let user = authState.user;
      console.log("User:", user);
      if (typeof user === "undefined" || user === null) {
        if (state.createAsAnonymous) {
          user = (await firebase.auth().signInAnonymously()).user!;
        } else {
          dispatch({ type: "requestSignInForCreate" });
          return;
        }
      }
      const payload: IEvent = {
        name: state.name,
        owner: {
          name: user.isAnonymous
            ? "Anonymous"
            : user.displayName || "Anonymous",
          uid: user.uid
        },
        options: state.eventOptions
      };
      const docRef = firebase
        .firestore()
        .collection("events")
        .doc(state.slug);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        dispatch({ type: "alreadyExists" });
        return;
      }
      await docRef.set(payload);
      dispatch({ type: "createdSuccessfully" });
      window.setTimeout(() => {
        router.history.push("/" + state.slug, { justCreated: true });
      }, 1500);
    } catch (e) {
      dispatch({ type: "creationError", err: e });
    }
  }

  useEffect(() => {
    if (state.createAsAnonymous) {
      create();
    }
  }, [state.createAsAnonymous]);

  return (
    <Container>
      <h1>Who the fuck is coming to...</h1>
      <div>
        {authState.initialising && <Spinner size="sm" />}
        {authState.user && (
          <span>
            Hello,{" "}
            {authState.user.displayName ||
              (authState.user.isAnonymous ? "anonymous user!" : "WAT")}
          </span>
        )}
      </div>
      <Input
        placeholder="Where the fuck are people going?"
        className="big-text-box"
        type="text"
        value={state.name}
        onChange={e => dispatch({ type: "setName", name: e.target.value })}
      />
      <InputGroup>
        <InputGroupAddon addonType="prepend">
          https://whothefuckiscomingto.markspolakovs.me/
        </InputGroupAddon>
        <Input
          type="text"
          value={state.slug}
          onChange={e => dispatch({ type: "setSlug", slug: e.target.value })}
        />
      </InputGroup>
      {state.alreadyExists && (
        <Alert color="warning">
          That URL is already taken. Please use a different one.
        </Alert>
      )}
      <Card style={{ padding: 8 }}>
        <CardBody>
          <InputGroup>
            <label>
              <Input
                type="checkbox"
                checked={state.eventOptions.private}
                onChange={e =>
                  dispatch({ type: "private", value: e.target.checked })
                }
              />
              Private - only you can see who has responded
            </label>
          </InputGroup>
        </CardBody>
      </Card>

      <Button
        color={
          state.createdSuccessfully
            ? "success"
            : state.creationError
            ? "danger"
            : "primary"
        }
        onClick={create}
      >
        Create
        <Fade in={state.creating} style={{ display: "inline-block" }}>
          <Spinner size="sm" />
        </Fade>
      </Button>

      {state.createdSuccessfully && (
        <Alert color="success">Event created! Please wait one second...</Alert>
      )}

      {state.creationError && (
        <Alert color="danger">
          An error has occurred! We're sorry, please try again or contact us.
        </Alert>
      )}

      <SignInModals state={state} dispatch={dispatch} />
    </Container>
  );
};
