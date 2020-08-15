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

function shuffleTiles() : number[] {
  const tiles = Array.apply(null, Array(numTiles)).map( (x, i) => {return i});
  for (let i = tiles.length - 1; i >= 0; i -= 1) {
    const j = Math.floor(Math.random() * i);
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]]
  }
  return tiles;
}

// TODO add user to room's hand fields
export const joinRoom = functions.https.onCall( async (data, context) => {
  const userId = data['userId'];
  const roomId = data['roomId'];
  const roomRef = db.doc(`rooms/${roomId}`)
  const userRef = db.doc(`users/${userId}`)

  try {
    return await db.runTransaction(async t => {
      const userDoc = await t.get(userRef);
      const roomDoc = await t.get(roomRef);

      const userData = userDoc.data();
      const roomData = roomDoc.data();

      if (!userDoc || !userData) {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found'
        );
      }
      if (!roomDoc || !roomData) {
        throw new functions.https.HttpsError(
          'not-found',
          'Room not found'
        );
      }

      const username = userData.username;
      const userIds = roomData.userIds;
      let newCount = roomData.numUsers;

      // TODO
      if (newCount >= 4) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Room full'
        );
      }

      if (userIds.includes(userId)) {
        newCount += 1
      }

      await addUserToRoom(userId, roomId);
      await t.update(roomRef, {
        userIds: admin.firestore.FieldValue.arrayUnion(userId),
        usernames: admin.firestore.FieldValue.arrayUnion(username),
        numUsers: newCount
      });
      return { success: true };
    });
  } catch (e) {
    functions.logger.error(e);
    throw e;
  }

  throw new functions.https.HttpsError(
    'failed-precondition',
    'Could not join room'
  );
});

async function setRoomTiles(roomId: string) {
  const mappingRef = db.collection('mappings').doc(roomId)
  mappingRef.set({order: shuffleTiles()})
}

async function addUserToRoom(userId: string, roomId: string) {
  const batch = db.batch();

  const userRef = db.collection(`rooms/${roomId}/users`).doc(userId);
  const discardRef = db.collection(`rooms/${roomId}/discarded`).doc(userId);
  const revealedRef = db.collection(`rooms/${roomId}/revealed`).doc(userId);
  const handRef = db.collection(`rooms/${roomId}/hand`).doc(userId);

  batch.set(userRef, {'exists': true});
  batch.set(discardRef, {'tiles': []});
  batch.set(revealedRef, {'tiles': []});
  batch.set(handRef, {'tiles': []});

  batch.commit();
}

export const newRoom = functions.https.onCall( async (data, context) => {
  const userId = data['userId'];
  const roomRef = db.collection('rooms').doc();
  const roomId = await roomRef.set(baseRoomValues)
    .then( (res) => {
      return roomRef.id;
    });

  await setRoomTiles(roomId);
  return await addUserToRoom(userId, roomId)
    .then((res) => {
      return {roomId: roomId, userId: userId}
    });
});

export const drawTile = functions.https.onCall( async(data, context) => {
  const roomId = data.roomId;
  const userId = data.userId;
  const mappingRef = db.doc(`mappings/${roomId}`)
  const userHandRef = db.doc(`rooms/${roomId}/hand/${userId}`)

  try {
    return await db.runTransaction(async t => {
      const doc = await t.get(mappingRef);
      const data = doc.data();
      if (!doc || !data) {
        throw new functions.https.HttpsError(
          'not-found',
          'Room not found'
        );
      }
      const order = data.order;
      if (order.length <= 0) {
        throw new functions.https.HttpsError(
          'not-found',
          'No more tiles to draw'
        );
      }
      const tileId = order[0];
      await t.update(userHandRef, {
        tiles: admin.firestore.FieldValue.arrayUnion(tileId)
      });
      await t.update(mappingRef, {
        order: admin.firestore.FieldValue.arrayRemove(tileId)
      });

      return { tileId: tileId };
    })
  } catch (e) {
    functions.logger.error(e);
  }

  throw new functions.https.HttpsError(
    'not-found',
    'Could not draw tile'
  );
});