import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import firebase from '../firebase';

type MatchParams = {
  roomId: string
}

function LobbyPage({match} : RouteComponentProps<MatchParams>) {
  const history = useHistory();
  const roomId = match.params.roomId;
  const [usernames, setUsernames] = useState<string[]>([]);

  function startGame() {
    // TODO verify there are 4 users in the lobby in firebase to go to game
    history.push('/game/' + roomId + '/game');
  }

  useEffect(() => {
    if (roomId) {
      const ref = firebase.firestore().collection('rooms').doc(roomId);
      ref.onSnapshot(function(doc) {
        const data = doc.data();
        if (data) {
          setUsernames(data.usernames);
        }
      })
    }
  }, [roomId])

  return (
    <div>
      <div>Lobby Page</div>
      <div>{usernames}</div>
      <button onClick={startGame}>Go to game</button>
    </div>
  );
}

export default LobbyPage;