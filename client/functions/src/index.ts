import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

const newRoomValues = {
  'numGames': 0,
  'numPlayers': 0,
  'playerOrder': [],
  'playerIndex': 0,
  'headIndex': 0,
  'tailIndex': 0,
  'mapping': [],
  'players': {},
  'tiles': {}
}

// const newPlayerValues = {
//   'hand': [],
//   'revealedTiles': [],
//   'discardedTiles': [],
//   'activeTile': null
// }

// const docRef = db.collection('rooms');
// await docRef.set(newRoomValues);
// return {data: 'ok'}

export const helloWorld = functions.https.onRequest((req, resp) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  resp.send("Hello from Firebase!");
});

// TODO generate user ID too?
export const newRoom = functions.https.onCall( async (data, context) => {
  const docRef = db.collection('rooms').doc();
  return await docRef.set(newRoomValues)
    .then( (res) => {
      return {roomId: docRef.id}
    });
});

export const deleteRoom = functions.https.onCall( (data, context) => {
  const roomId = data.roomId;
  functions.logger.info("Deleting room - " + roomId);

});

export const newGame = functions.https.onCall( (data, context) => {
  const roomId = data.roomId;
  functions.logger.info("Creating new game in - " + roomId);
});