import React, { useEffect, useState } from 'react';
import interact from 'interactjs';
import styled from 'styled-components';
import io from 'socket.io-client';

type DiscardAreaProps = {
  roomId: string;
  playerId: string;
}

const DiscardAreaStyle = styled.div`
  background-color: #ccc;
  border: dashed 4px transparent;
  border-radius: 4px;
  margin: 10px auto 30px;
  padding: 10px;
  width: 80%;
  height: 400px;
`

const socket = io('http://localhost:3001/');

function DiscardArea(props : DiscardAreaProps) {
  const [playerId, setPlayerId] = useState('')
  const [roomId, setRoomId] = useState('')

  function assignDiscardArea() {
    // TODO stale closure
    // roomId and playerId are ''
    console.log(roomId, playerId);

    interact('.discardarea')
      .dropzone({
        accept: '.tile',
        overlap: 0.75,
        ondragleave: (event) => {
          console.log("Emit draw from discard");
        },
        ondrop: (event) => {
          console.log("Emit discardTile()", roomId, event.relatedTarget.id, playerId);
          socket.emit('discardTile', {'roomId': roomId, 'tileId': event.relatedTarget.id, 'playerId': playerId})
        }
      });
  }

  useEffect( () => {
    socket.connect();

    setPlayerId(props.playerId);
    setRoomId(props.roomId);
    assignDiscardArea();      

    socket.on('discardedTile', () => console.log('Successfully discarded tile'));

    return ( () => {
      // TODO needed?
      interact('.discardarea').unset();

      socket.removeAllListeners();
      socket.close()
    })
  }, [props.playerId, props.roomId]);

  return(
    <DiscardAreaStyle className='discardarea'>
      Discard Area
    </DiscardAreaStyle>
  )
}

export default DiscardArea;