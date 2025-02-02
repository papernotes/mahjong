import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();
const db = admin.firestore();

const numTiles = 144;
const baseRoomValues = {
  'numGames': 0,
  'numUsers': 0,
  'userIds': [],
  'usernames': [],
  'userIndex': 0,
  'lastAction': 'Game started!',
  'lastActionTileId': -1,
  'numActions': 1,
  'roomOwner': '',
  'startedGame': false
}

function shuffleTiles() : number[] {
  const tiles = Array.apply(null, Array(numTiles)).map( (x, i) => {return i});
  for (let i = tiles.length - 1; i >= 0; i -= 1) {
    const j = Math.floor(Math.random() * i);
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]]
  }
  return tiles;
}

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

      if (userIds.includes(userId)) {
        functions.logger.info('User already added to room');
        return;
      }

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
      t.update(roomRef, {
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
});

async function setRoomTiles(roomId: string) {
  const mappingRef = db.collection('mappings').doc(roomId)
  const countRef = db.collection(`mappings/${roomId}/tilesLeft`).doc('count');
  void mappingRef.set({order: shuffleTiles()})
  void countRef.set({count: numTiles});
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

  void batch.commit();
}

export const startGame = functions.https.onCall(async(data, context) => {
  const userId = data['userId'];
  const roomId = data['roomId'];
  const roomRef = db.collection('rooms').doc(roomId);

  try {
    return await db.runTransaction(async t => {
      const roomDoc = await t.get(roomRef);
      const roomData = roomDoc.data();

      if (roomData && roomData.roomOwner === userId) {
        t.update(roomRef, {
          startedGame: true
        });
      }
      return {success: true}
    });
  } catch (e) {
    functions.logger.error(e);
  }

  throw new functions.https.HttpsError(
    'not-found',
    'Could not start game'
  );

})

export const newRoom = functions.https.onCall( async (data, context) => {
  const userId = data['userId'];
  const roomRef = db.collection('rooms').doc();

  try {
    return await db.runTransaction(async t => {
      const newRoomValues = JSON.parse(JSON.stringify(baseRoomValues));
      newRoomValues['roomOwner'] = userId;
      const roomId = await roomRef.set(newRoomValues)
        .then( (res) => {
          return roomRef.id;
        });
      await setRoomTiles(roomId);
      return await addUserToRoom(userId, roomId)
        .then((res) => {
          return {roomId: roomId, userId: userId}
        });
    })
  } catch (e) {
    functions.logger.error(e);
  }
  throw new functions.https.HttpsError(
    'not-found',
    'Could not create room'
  );
});

const drawTileOpts = {
  timeoutSeconds: 300
}

export const drawTile = functions.runWith(drawTileOpts).https.onCall( async(data, context) => {
  const roomId = data.roomId;
  const userId = data.userId;
  const mappingRef = db.doc(`mappings/${roomId}`)
  const countRef = db.collection(`mappings/${roomId}/tilesLeft`).doc('count');
  const userHandRef = db.doc(`rooms/${roomId}/hand/${userId}`)

  try {
    return await db.runTransaction(async t => {
      const doc = await t.get(mappingRef);
      const mapData = doc.data();
      if (!doc || !mapData) {
        throw new functions.https.HttpsError(
          'not-found',
          'Room not found'
        );
      }
      const order = mapData.order;
      if (order.length <= 0) {
        throw new functions.https.HttpsError(
          'not-found',
          'No more tiles to draw'
        );
      }
      const tileId = order[0];
      t.update(userHandRef, {
        tiles: admin.firestore.FieldValue.arrayUnion(tileId)
      });
      t.update(mappingRef, {
        order: admin.firestore.FieldValue.arrayRemove(tileId)
      });
      t.update(countRef, {
        count: admin.firestore.FieldValue.increment(-1)
      })

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

export const logLastAction = functions.https.onCall( async(data, context) => {
  const roomId = data.roomId;
  const message = data.message;
  const tileId = data.tileId
  const roomRef = db.doc(`rooms/${roomId}`);

  try {
    await db.runTransaction(async t => {
      t.update(roomRef, {
        lastAction: message,
        lastActionTileId: tileId,
        numActions: admin.firestore.FieldValue.increment(1)
      });
    })
    .catch((err) => {
      functions.logger.error(err);
    });
  } catch (e) {
    functions.logger.error(e);
    throw e;
  }
})