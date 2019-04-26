import * as firebase from "firebase/app";
import "firebase/auth";

let auth = false;

export async function waitForAuth(): Promise<void> {
  if (auth) {
    return Promise.resolve();
  }
  return new Promise<void>(resolve => {
    const unload = firebase.auth().onAuthStateChanged(state => {
      unload();
      auth = true;
      resolve();
    });
  });
}
