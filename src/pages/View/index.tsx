import React, { useReducer, useEffect, useState, useRef } from "react";
import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { RouteComponentProps } from "react-router";
import {
  useDocumentData,
  useCollectionData
} from "react-firebase-hooks/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { IoIosCheckmark, IoIosClose } from "react-icons/io";
import { IEvent, IEventAttendee } from "../../types";
import {
  Spinner,
  Container,
  Card,
  CardBody,
  Input,
  Button,
  FormGroup,
  Fade,
  ModalBody,
  Modal,
  ModalFooter,
  ButtonGroup,
  CardFooter,
  Alert
} from "reactstrap";
import { logAction } from "../../util/log";
import SignInModals, {
  ISignInModalState,
  ModalType
} from "../../components/SignInModals";
import { waitForAuth } from "../../util/auth";
import { Link } from "react-router-dom";
import Helmet from "react-helmet";

const Attendees: React.FC<{ event: IEvent; id: string }> = ({ event, id }) => {
  const auth = useAuthState(firebase.auth());
  const { error, loading, value: attendees } = useCollectionData<
    IEventAttendee
  >(
    firebase
      .firestore()
      .collection("events")
      .doc(id)
      .collection("responses")
  );

  const [promptDelet, setPromptDelet] = useState<{
    uid: string;
    name: string;
  } | null>(null);
  function delet() {
    if (promptDelet === null) {
      return;
    }
    firebase
      .firestore()
      .collection("events")
      .doc(id)
      .collection("responses")
      .doc(promptDelet.uid)
      .delete();
    setPromptDelet(null);
  }

  if (error) {
    throw error;
  }
  if (loading || typeof attendees === "undefined") {
    return <Spinner size="lg" />;
  }
  return (
    <div className="inset">
      <h3>Who the fuck's coming?</h3>
      {attendees.length === 0 && (
        <div>
          <b>Nobody has fucking responded!</b>
        </div>
      )}
      {attendees.map(att => (
        <Card key={att.uid}>
          <CardBody>
            {att.coming ? (
              <IoIosCheckmark size="3em" />
            ) : (
              <IoIosClose size="3em" />
            )}
            <span className="attendee">{att.name}</span>
            {att.note && <p>{att.note}</p>}
            {auth.user && auth.user.uid === event.owner.uid && (
              <Button
                style={{ float: "right" }}
                color="link"
                onClick={() => setPromptDelet(att)}
              >
                Delete
              </Button>
            )}
          </CardBody>
        </Card>
      ))}
      <Modal isOpen={promptDelet !== null}>
        {promptDelet !== null && (
          <>
            <ModalBody>
              Are you sure you want to delete {promptDelet.name}'s response to
              this event?
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setPromptDelet(null)}>
                Cancel
              </Button>
              <Button color="danger" onClick={delet}>
                Delete
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
};

interface IRFState extends ISignInModalState {
  stillWaiting: boolean;
  name: string;
  nameTouched: boolean;
  coming: boolean;
  note: string;
  saving: boolean;
  savedSuccessfully: boolean;
  saveError: any | null;
  alreadyResponded: boolean;
  promptDelet: boolean;
}
const initialRFState: IRFState = {
  stillWaiting: true,
  name: "",
  nameTouched: false,
  coming: true,
  note: "",
  signInPromptOpen: null,
  signInModalOpen: false,
  saving: false,
  savedSuccessfully: false,
  saveError: null,
  alreadyResponded: false,
  promptDelet: false
};

type RFAction =
  | { type: "weHaventResponded" }
  | { type: "yesWeHaveResponded"; response: IEventAttendee }
  | { type: "saving" }
  | { type: "savedSuccessfully" }
  | { type: "saveError"; err: any }
  | { type: "requestSignIn" }
  | { type: "signInSuccessful" }
  | { type: "ceaseSignIn" }
  | { type: "signIn" }
  | { type: "goToHellYouStupidModal" }
  | { type: "ignoreSignInWarning" }
  | { type: "setName"; name: string }
  | { type: "setDefaultName"; name: string }
  | { type: "setComing"; coming: boolean }
  | { type: "setNote"; note: string }
  | { type: "reset" }
  | { type: "resetAll" }
  | { type: "promptDelet" }
  | { type: "closeDelet" };

function rfReducer(state: IRFState, action: RFAction): IRFState {
  logAction(action, "ResponseForm");
  switch (action.type) {
    case "weHaventResponded":
      return { ...state, stillWaiting: false };
    case "yesWeHaveResponded":
      return {
        ...state,
        stillWaiting: false,
        alreadyResponded: true,
        ...action.response
      };
    case "setDefaultName":
      return { ...state, name: action.name };
    case "setName":
      return { ...state, name: action.name, nameTouched: true };
    case "setComing":
      return { ...state, coming: action.coming };
    case "setNote":
      return { ...state, note: action.note };
    case "requestSignIn":
      return { ...state, signInPromptOpen: ModalType.RESPOND };
    case "signIn":
      return { ...state, signInModalOpen: true };
    case "ceaseSignIn":
      return { ...state, signInModalOpen: false };
    case "signInSuccessful":
      return {
        ...state,
        signInPromptOpen: null,
        signInModalOpen: false
      };
    case "ignoreSignInWarning":
      return {
        ...state,
        signInPromptOpen: null
      };
    case "goToHellYouStupidModal":
      return { ...state, signInPromptOpen: null };
    case "saving":
      return { ...state, saving: true };
    case "savedSuccessfully":
      return {
        ...state,
        saving: false,
        savedSuccessfully: true,
        alreadyResponded: true
      };
    case "saveError":
      return { ...state, saving: false, saveError: action.err };
    case "reset":
      return {
        ...state,
        saving: false,
        savedSuccessfully: false,
        saveError: null
      };
    case "resetAll":
      return {
        ...state,
        saving: false,
        savedSuccessfully: false,
        saveError: null,
        alreadyResponded: false
      };
    case "promptDelet":
      return {
        ...state,
        promptDelet: true
      };
    case "closeDelet":
      return {
        ...state,
        promptDelet: false
      };
    default:
      throw new Error();
  }
}

const ResponseForm: React.FC<{ event: IEvent; id: string }> = ({
  id,
  event
}) => {
  const auth = useAuthState(firebase.auth());
  const [state, dispatch] = useReducer(rfReducer, initialRFState);

  useEffect(() => {
    if (!state.stillWaiting) {
      return;
    }
    if (auth.initialising) {
      return;
    }
    if (!auth.user) {
      dispatch({ type: "weHaventResponded" });
      return;
    }
    firebase
      .firestore()
      .collection("events")
      .doc(id)
      .collection("responses")
      .doc(auth.user.uid)
      .get()
      .then(snap => {
        if (snap.exists) {
          dispatch({
            type: "yesWeHaveResponded",
            response: snap.data() as IEventAttendee
          });
        } else {
          dispatch({ type: "weHaventResponded" });
          firebase.auth().onAuthStateChanged(user => {
            if (user && user.displayName && !state.nameTouched) {
              dispatch({ type: "setDefaultName", name: user.displayName });
            }
          });
        }
      });
  }, [id, auth.initialising, auth.user]);

  async function save() {
    try {
      dispatch({ type: "saving" });
      if (auth.initialising) {
        await waitForAuth();
      }
      let user = auth.user;
      console.log("User:", user);
      if (typeof user === "undefined" || user === null) {
        user = (await firebase.auth().signInAnonymously()).user!;
      }

      const payload: IEventAttendee = {
        uid: user.uid,
        name: state.name,
        coming: state.coming
      };
      if (state.note.length > 0) {
        payload.note = state.note;
      }
      await firebase
        .firestore()
        .collection("events")
        .doc(id)
        .collection("responses")
        .doc(user.uid)
        .set(payload);
      dispatch({ type: "savedSuccessfully" });
      if (user.isAnonymous) {
        dispatch({ type: "requestSignIn" });
      }
      window.setTimeout(() => {
        dispatch({ type: "reset" });
      }, 800);
    } catch (e) {
      dispatch({ type: "saveError", err: e });
    }
  }

  async function delet() {
    const user = auth.user;
    if (!user) {
      return;
    }
    await firebase
      .firestore()
      .collection("events")
      .doc(id)
      .collection("responses")
      .doc(user.uid)
      .delete();
    dispatch({ type: "closeDelet" });
    dispatch({ type: "resetAll" });
  }

  async function onSignInError(err: firebaseui.auth.AuthUIError) {
    if (err.code != "firebaseui/anonymous-upgrade-merge-conflict") {
      return;
    }
    if (!auth.user) {
      return;
    }
    const user = auth.user;
    // Copy the response data from the current user,
    // delete it,
    // sign in with the new user
    // and save under the new UID
    const dataRef = firebase
      .firestore()
      .collection("events")
      .doc(id)
      .collection("responses")
      .doc(user.uid);
    const dataSnap = await dataRef.get();
    const data = dataSnap.data()!;
    await dataRef.delete();
    const newUser = await firebase.auth().signInWithCredential(err.credential);
    await firebase
      .firestore()
      .collection("events")
      .doc(id)
      .collection("responses")
      .doc(newUser.uid)
      .set(data);
  }

  return (
    <div style={{ marginBottom: 64, marginTop: 32 }}>
      <b>Are you fucking coming?</b>
      <Input
        type="text"
        placeholder="Who the fuck are you, anyway?"
        value={state.name}
        onChange={e => dispatch({ type: "setName", name: e.target.value })}
      />
      <FormGroup>
        <label>
          <Input
            type="checkbox"
            checked={state.coming}
            onChange={e =>
              dispatch({ type: "setComing", coming: e.target.checked })
            }
          />
          Are you even coming or not?
        </label>
      </FormGroup>
      <FormGroup>
        <textarea
          rows={2}
          cols={80}
          value={state.note}
          onChange={e => dispatch({ type: "setNote", note: e.target.value })}
          placeholder="Add a note if you wish (are you going to be fucking late?)"
        />
      </FormGroup>

      <ButtonGroup>
        <Button
          color={
            state.savedSuccessfully
              ? "success"
              : state.saveError
              ? "danger"
              : "primary"
          }
          onClick={save}
        >
          Fucking save!
          <Fade in={state.saving} style={{ display: "inline-block" }}>
            <Spinner size="sm" />
          </Fade>
        </Button>
      </ButtonGroup>

      {state.alreadyResponded && (
        <Button
          color="secondary"
          onClick={() => dispatch({ type: "promptDelet" })}
        >
          Delete my response
        </Button>
      )}

      <Modal isOpen={state.promptDelet}>
        <ModalBody>
          Are you sure you want to delete your response to this event?
        </ModalBody>
        <ModalFooter>
          <Button
            color="secondary"
            onClick={() => dispatch({ type: "closeDelet" })}
          >
            Cancel
          </Button>
          <Button color="danger" onClick={delet}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>

      <SignInModals
        state={state}
        dispatch={dispatch}
        onError={onSignInError}
        showIgnore={false}
      />
    </div>
  );
};

interface IProps extends RouteComponentProps<{ id: string }> {}

export const ViewPage: React.FC<IProps> = ({ match, location }) => {
  const auth = useAuthState(firebase.auth());
  const id = match.params.id;
  const { error, loading, value: event } = useDocumentData<IEvent>(
    firebase
      .firestore()
      .collection("events")
      .doc(id)
  );

  useEffect(() => {
    if (event) {
      document.title = `Who the fuck is coming to ${event.name}?`;
    }
  }, [event]);

  if (error) {
    console.error(error);
    return (
      <Container>
        <h1>Catastrophe!</h1>
      </Container>
    );
  }
  if (loading || !event) {
    return (
      <Container>
        <Spinner size="lg" />
        Loading event data, please wait...
      </Container>
    );
  }
  return (
    <Container>
      <h1>Who the fuck is coming to {event.name}?</h1>

      {location.state && location.state.justCreated && (
        <Alert color="success">
          <b>Successfully created!</b> Share this page with all your friends
          using this link:
          <div>
            <input
              readOnly
              style={{ width: "100%" }}
              type="text"
              value={`https://whothefuckiscomingto.markspolakovs.me/${id}`}
              onClick={e => e.currentTarget.focus()}
            />
          </div>
        </Alert>
      )}

      <h3>Created by {event.owner.name}</h3>
      <ResponseForm event={event} id={id} />
      {!event.options.private ||
      (auth.user && auth.user.uid === event.owner.uid) ? (
        <Attendees id={id} event={event} />
      ) : (
        <b style={{ display: "block" }}>
          This event is private, only the creator can see who is fucking coming.
        </b>
      )}

      <Link to="/">Create your own page like this!</Link>
    </Container>
  );
};
