# mahjong
A React + TypeScript project with Cloud Firestore and Cloud Functions

# Local
## Set Up
- Download and set up [firebase-tools](https://firebase.google.com/docs/cli)
- Set up [Firebase Emulators](https://firebase.google.com/docs/rules/emulator-setup#install_the) to run emulators locally
```
cd client
yarn install
cd functions
npm install
```

## Running
```
// From /client
yarn start

// From /client/functions run emulator locally
npm run emulate
```

## Building + Deploying
Create a `client/.env` file for the webapp's [firebaseConfig](https://firebase.google.com/docs/firestore/quickstart#initialize)
```
REACT_APP_API_KEY=""
REACT_APP_AUTH_DOMAIN=""
REACT_APP_DATABASE_URL=""
REACT_APP_PROJECT_ID=""
REACT_APP_STORAGE_BUCKET=""
REACT_APP_MESSAGING_SENDER_ID=""
REACT_APP_APP_ID=""
REACT_APP_MEASUREMENT_ID=""
```
```
// From /client
yarn build

// With firebase tools
firebase deploy
```
