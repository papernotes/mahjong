import React, { useEffect, useState } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import io from 'socket.io-client';
import styled from "styled-components";

import Tile from '../components/Tile';
import DiscardArea from '../components/DiscardArea';
import { Droppable } from 'react-beautiful-dnd';
import { DragDropContext } from 'react-beautiful-dnd';

type MatchParams = {
  roomId: string,
  playerId: string
}

const TileList = styled.div`
  padding: 8px;
  display: flex;
`

const HandArea = styled.div``

const socket = io('http://localhost:3001/');

function GamePage({match} : RouteComponentProps<MatchParams>) {
  const playerId = match.params.playerId;
  const roomId = match.params.roomId;
  const [tiles, setTiles] = useState<number[]>([]);
  const history = useHistory();

  useEffect( () => {
    let unmounted = false;

    socket.connect();

    socket.on('cannotDrawHead', () => console.log('Cannot draw head anymore'));
    socket.on('cannotDrawTail', () => console.log('Cannot draw tail anymore'));
    socket.on('drewTile', (tileId: number) => {
      if (!unmounted) {
        setTiles(tiles => [...tiles, tileId]);
      }
    });

    return () => {
      unmounted = true;
      socket.removeAllListeners();
      socket.close();
    }
  }, []);

  function drawHead() {
    socket.emit('drawHead', {'roomId': roomId, 'playerId': playerId});
  }

  function drawTail() {
    socket.emit('drawTail', {'roomId': roomId, 'playerId': playerId});
  }

  function superDrawHead() {
    for (let i = 0; i < 144; i ++) {
      socket.emit('drawHead', {'roomId': roomId, 'playerId': playerId});
    }
  }

  function goHome() {
    history.push('/');
  }

  function onDragEnd(result: any) {
    const { destination, source, draggableId } = result;
    if (!destination) {
      return;
    }
    if (destination.droppableId === source.draggableId &&
        destination.index === source.index) {
      return;
    }

    const newTiles = Array.from(tiles);
    newTiles.splice(source.index, 1)
    newTiles.splice(destination.index, 0, draggableId);

    setTiles(newTiles)
  }

  return (
    <DragDropContext
      onDragEnd={onDragEnd}>
      <div>
        <h2>Game Page - {match.params.roomId} </h2>
        <DiscardArea roomId={roomId} playerId={playerId}/>
        <HandArea>
          <Droppable droppableId={playerId} direction='horizontal'>
            {(provided, snapshot) =>
              <TileList
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {tiles.map( (tileId, index) => <Tile key={tileId} id={tileId} index={index}/>)}
                {provided.placeholder}
              </TileList>
            }
          </Droppable>
        </HandArea>
        <button onClick={goHome}>Go Home</button>
        <button onClick={drawHead}>Draw Head</button>
        <button onClick={drawTail}>Draw Tail</button>
        <button onClick={superDrawHead}>Super Draw Head - Draws 144 times</button>
      </div>
    </DragDropContext>
  );
}

export default GamePage;