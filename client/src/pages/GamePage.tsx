import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import io from 'socket.io-client';

import HandArea from '../components/HandArea';
import PlayerMoves from '../components/PlayerMoves';
import DiscardArea from '../components/DiscardArea';
import { DragDropContext } from 'react-beautiful-dnd';

type MatchParams = {
  roomId: string,
  playerId: string
}

const socket = io('http://localhost:3001/');

function GamePage({match} : RouteComponentProps<MatchParams>) {
  const playerId = match.params.playerId;
  const roomId = match.params.roomId;

  const [tiles, setTiles] = useState<number[]>([]);
  const [discardTiles, setDiscardedTiles] = useState<number[]>([]);


  useEffect( () => {
    let unmounted = false;

    socket.connect();

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

  // TODO update/refactor to be cleaner
  // map sources/destinations droppableIds to
  // state containing respective tiles
  // const areas = ['hand', 'discard'];
  function onDragEnd(result: any) {
    const { destination, source, draggableId } = result;
    if (!destination) { return }
    if (destination.droppableId === source.draggableId &&
        destination.index === source.index) { return }

    const start = source.droppableId;
    const finish = destination.droppableId;

    if (start === finish) {
      let newTiles;
      let inHand = true;

      if (start.includes("hand")) {
        newTiles = Array.from(tiles);
      } else {
        inHand = false;
        newTiles = Array.from(discardTiles);
      }

      newTiles.splice(source.index, 1)
      newTiles.splice(destination.index, 0, draggableId);

      if (inHand) {
        setTiles(newTiles);
      } else {
        setDiscardedTiles(newTiles);
      }
    } else {
      let primary;
      let secondary;
      let inHand = true;

      if (start.includes("hand")) {
        primary = Array.from(tiles);
        secondary = Array.from(discardTiles);
      } else {
        inHand = false;
        primary = Array.from(discardTiles);
        secondary = Array.from(tiles);
      }

      primary.splice(source.index, 1);
      secondary.splice(destination.index, 0, draggableId);

      if (inHand) {
        setTiles(primary);
        setDiscardedTiles(secondary);
      } else {
        setTiles(secondary);
        setDiscardedTiles(primary);
      }
    }
  }

  return (
    <DragDropContext
      onDragEnd={onDragEnd}>
      <div>
        <h2>Game Page - {match.params.roomId} </h2>
        <DiscardArea tiles={discardTiles} roomId={roomId} playerId={playerId}/>
        <HandArea tiles={tiles}/>
        <PlayerMoves socket={socket} roomId={roomId} playerId={playerId}/>
      </div>
    </DragDropContext>
  );
}

export default GamePage;