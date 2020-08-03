import React, { useEffect, useState, useContext } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import firebase from '../firebase';
import { UserContext } from '../context';

type MatchParams = {
  roomId: string
}

function LobbyPage({match} : RouteComponentProps<MatchParams>) {
  const history = useHistory();
  const userId = useContext(UserContext).userId;
  const userCreated = useContext(UserContext).userCreated;
  const roomId = match.params.roomId;
  const [usernames, setUsernames] = useState<string[]>([]);

  function startGame() {
    // TODO verify there are 4 users in the lobby in firebase to go to game
    history.push('/game/' + roomId + '/game');
  }

  function updateRoom(name : string) {
    const ref = firebase.firestore().collection('rooms').doc(roomId);
    ref.update({
      userIds: firebase.firestore.FieldValue.arrayUnion(userId),
      usernames: firebase.firestore.FieldValue.arrayUnion(name)
    });

    ref.onSnapshot(function(doc) {
      const data = doc.data();
      if (data) {
        setUsernames(data.usernames);
      }
    })
  }

  useEffect(() => {
    // TODO only allow users to join the room if there are <= 4 people in the room already
    // TODO nav to roomfull
    if (roomId && userId) {
      const userRef = firebase.firestore().doc(`users/${userId}`);
      userRef.get()
        .then((doc) => {
          if (doc.exists) {
            const data = doc.data();
            if (data) {
              updateRoom(data.username);
            }
          }
        })
        .catch((err) => {
          console.error('err', err)
        })
    }
  }, [roomId, userId, userCreated])

  function listUsernames() {
    return(
      <div>
        {usernames.map( (username, index) => <li key={index}>{username}</li>)}
      </div>
    )
  }

  return (
    <div>
      <div>Lobby Page</div>
      <div>{listUsernames()}</div>
      <button onClick={startGame}>Go to game</button>
    </div>
  );
}

export default LobbyPage;