import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

const numTiles = 144;
const baseRoomValues = {
  'numGames': 0,
  'numUsers': 0,
  'userIds': [],
  'usernames': [],
  'userIndex': 0
}
const newPlayerValues = {
  'hand': [],
  'revealedTiles': [],
  'discardedTiles': []
}

function shuffleTiles() : number[] {
  const tiles = Array.apply(null, Array(numTiles)).map( (x, i) => {return i});
  for (let i = tiles.length - 1; i >= 0; i -= 1) {
    const j = Math.floor(Math.random() * i);
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]]
  }
  return tiles;
}

export const newRoom = functions.https.onCall( async (data, context) => {
  const userId = data['userId'];
  const roomRef = db.collection('rooms').doc();
  const roomId = await roomRef.set(baseRoomValues)
    .then( (res) => {
      return roomRef.id;
    });
  const mappingRef = db.collection('mappings').doc(roomId)

  await mappingRef.set({order: shuffleTiles()})

  return await db.doc(`rooms/${roomId}/users/${userId}`)
    .set(newPlayerValues)
    .then( (res) => {
      return {roomId: roomId, userId: userId}
    });
});

export const drawTile = functions.https.onCall( async(data, context) => {
  const roomId = data.roomId;
  const userId = data.userId;
  const mappingRef = db.doc(`mappings/${roomId}`)
  const userRef = db.doc(`rooms/${roomId}/users/${userId}`)

  const order = await mappingRef.get()
    .then((res) => {
      if (!res.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Room not found'
        );
      }
      return res.get('order');
    })

  if (order.length <= 0) {
    throw new functions.https.HttpsError(
      'not-found',
      'No more tiles to draw'
    );
  }

  const tileId = order[0];

  await userRef.get()
    .then( (res) => {
      if (res.exists) {
        userRef.update({
          hand: admin.firestore.FieldValue.arrayUnion(tileId)
        });
      } else {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found'
        );
      }
    });

  return await mappingRef.update(
    'order', admin.firestore.FieldValue.arrayRemove(tileId)
  ).then( () => {
    functions.logger.info('successfully removed tile');
    return {tileId: tileId}
  });
});