import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

const numTiles = 144;
const newRoomValues = {
  'numGames': 0,
  'numUsers': 0,
  'userOrder': [],
  'userIndex': 0,
  'headIndex': 0,
  'tailIndex': 0,
  'mapping': shuffleTiles()
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

  const roomId = await roomRef.set(newRoomValues)
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

// TODO add player to room
export const addPlayer = functions.https.onCall( async (data, context) => {

})

export const drawHead = functions.https.onCall( async(data, context) => {

});

export const drawTail = functions.https.onCall( async(data, context) => {

});

export const deleteRoom = functions.https.onCall( (data, context) => {
  const roomId = data.roomId;
  functions.logger.info("Deleting room - " + roomId);

});

export const newGame = functions.https.onCall( (data, context) => {
  const roomId = data.roomId;
  functions.logger.info("Creating new game in - " + roomId);
});