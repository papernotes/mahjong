import * as firebase from 'firebase/app';

import 'firebase/firestore';
import 'firebase/functions';
import 'firebase/auth';

let config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

firebase.initializeApp(config);

if (process.env.REACT_APP_LOCAL_DEV) {
  firebase.functions().useFunctionsEmulator('http://localhost:5001');
  firebase.firestore().settings({host:'localhost:8080', ssl: false});
}

export const db = firebase.firestore();

export default firebase;