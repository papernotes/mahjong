import React, { useEffect, useState, useContext } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import firebase, { db } from '../firebase';
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
  const [roomOwner, setRoomOwner] = useState('');

  function startGame() {
    // TODO verify there are 4 users in the lobby in firebase to go to game
    const startGame = firebase.functions().httpsCallable('startGame');
    try {
      startGame({userId: userId, roomId: roomId})
        .then((res) => {
          history.push('/game/' + roomId + '/game');
        })
        .catch((err) => {
          console.error(err);
        });
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    const ref = db.collection('rooms').doc(roomId);
    const unsubscribe = ref.onSnapshot(function(doc) {
      const data = doc.data();
      if (data) {
        setUsernames(data.usernames);
        setRoomOwner(data.roomOwner);
        console.log(data.startedGame);
        if (data.startedGame) {
          startGame();
        }
      }
    })

    if (roomId && userId) {
      const joinRoom = firebase.functions().httpsCallable('joinRoom');
      try {
        joinRoom({userId: userId, roomId: roomId})
          .then((res) => {
            console.log(res);
          })
          .catch((err) => {
            console.log(err);
            if (err.code === 'failed-precondition') {
              console.error('Cannot join room - lobby full');
            }
            if (!userId && err.code === 'not-found') {
              history.push('/');
              console.error('Non existent room')
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
  // eslint-disable-next-line
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
      {
        (userId === roomOwner) &&
        <button onClick={startGame}>Go to game</button>
      }
    </div>
  );
}

export default LobbyPage;