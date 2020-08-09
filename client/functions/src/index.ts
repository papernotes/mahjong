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

  const username = await userRef.get()
    .then((res) => {
      if (res.exists) {
        return res.get('username');
      } else {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found'
        );
      }
    })

  return await roomRef.get()
    .then((res) => {
      if (res.exists) {
        let newCount = res.get('numUsers');

        if (newCount >= 4) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Room full'
          );
          return {success: false}
        }

        if (!res.get('userIds').includes(userId)) {
          newCount += 1
        }

        addUserToRoom(userId, roomId);

        roomRef.update({
          userIds: admin.firestore.FieldValue.arrayUnion(userId),
          usernames: admin.firestore.FieldValue.arrayUnion(username),
          numUsers: newCount
        });

        return {success: true}
      } else {
        throw new functions.https.HttpsError(
          'not-found',
          'Room not found'
        );
        return {success: false}
      }
    })
})


async function setRoomTiles(roomId: string) {
  const mappingRef = db.collection('mappings').doc(roomId)
  mappingRef.set({order: shuffleTiles()})
}

async function addUserToRoom(userId: string, roomId: string) {
  // TODO possibly don't need - remove
  db.collection(`rooms/${roomId}/users`).doc(userId).set({'exists': true});
  // TODO batch update
  db.collection(`rooms/${roomId}/discarded`).doc(userId).set({'tiles': []})
  db.collection(`rooms/${roomId}/revealed`).doc(userId).set({'tiles': []})
  db.collection(`rooms/${roomId}/hand`).doc(userId).set({'tiles': []})
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

  await userHandRef.get()
    .then( (res) => {
      if (res.exists) {
        userHandRef.update({
          tiles: admin.firestore.FieldValue.arrayUnion(tileId)
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
    return {tileId: tileId}
  });
});