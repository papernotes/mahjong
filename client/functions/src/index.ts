import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

const numTiles = 144;
const baseRoomValues = {
  'numGames': 0,
  'numUsers': 0,
  'userOrder': [],
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

function newRoomValues() : object {
  let roomValues = JSON.parse(JSON.stringify(baseRoomValues));
  roomValues['mapping'] = shuffleTiles();
  return roomValues;
}

export const newRoom = functions.https.onCall( async (data, context) => {
  const userId = data['userId'];
  const roomRef = db.collection('rooms').doc();

  const roomId = await roomRef.set(newRoomValues())
    .then( (res) => {
      return roomRef.id;
    });

  await roomRef.update({
    userOrder: admin.firestore.FieldValue.arrayUnion(userId)
  })

  return await db
    .collection('rooms')
    .doc(roomId)
    .collection('users')
    .doc(userId)
    .set(newPlayerValues)
    .then( (res) => {
      return {roomId: roomId, userId: userId}
    });
});


export const drawTile = functions.https.onCall( async(data, context) => {
  const roomId = data.roomId;
  const userId = data.userId;
  const roomRef = db.doc(`rooms/${roomId}`);
  const userRef = db.doc(`rooms/${roomId}/users/${userId}`)

  const mapping = await roomRef.get()
    .then( (res) => {
      return res.get('mapping')
    });

  if (mapping.length <= 0) {
    throw new functions.https.HttpsError(
      'not-found',
      'No more tiles to draw'
    )
  }

  const tileId = mapping[0];

  await userRef.update({
    hand: admin.firestore.FieldValue.arrayUnion(tileId)
  });

  return await roomRef.update(
    'mapping', admin.firestore.FieldValue.arrayRemove(tileId)
  ).then( () => {
    functions.logger.info('successfully removed tile');
    return {tileId: tileId}
  });
});