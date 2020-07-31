import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useHistory } from 'react-router-dom';

type MatchParams = {
  roomId: string
}

function LobbyPage({match} : RouteComponentProps<MatchParams>) {
  const history = useHistory();
  const roomId = match.params.roomId;

  function startGame() {
    // TODO verify there are 4 users in the lobby in firebase to go to game
    history.push('/game/' + roomId + '/game');
  }

  return (
    <div>
      <div>Lobby Page</div>
      <button onClick={startGame}>Go to game</button>
    </div>
  );
}

export default LobbyPage;