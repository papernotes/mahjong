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

  useEffect(() => {
    const ref = firebase.firestore().collection('rooms').doc(roomId);
    const unsubscribe = ref.onSnapshot(function(doc) {
      const data = doc.data();
      if (data) {
        setUsernames(data.usernames);
      }
    })

    if (roomId && userId) {
      const joinRoom = firebase.functions().httpsCallable('joinRoom');
      try {
        joinRoom({userId: userId, roomId: roomId})
          .catch((err) => {
            if (err.code === 'failed-precondition') {
              console.error('Cannot join room - lobby full');
            }
            console.log('Still creating user');
          })
      } catch (err) {
        console.error('err');
      }
    }

    // TODO remove user from room
    return () => {
      unsubscribe();
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