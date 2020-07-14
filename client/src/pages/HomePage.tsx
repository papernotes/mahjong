import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3001/');

function HomePage() {
  const history = useHistory();

  useEffect( () => {
    socket.connect();

    socket.on('createdNewRoom', (data: any) => {
      history.push('/game/' + data['roomId'] + '/' + data['playerId']);
    });

    return () => {
      socket.removeAllListeners();
      socket.close();
    }
  }, []);

  function newRoom() {
    socket.emit('newRoom', () => {});
  }

  return (
    <div>
      <button onClick={newRoom}>New Room</button>
    </div>
  );
}

export default HomePage;