import React, { useEffect, useState, useContext } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import HandArea from '../components/HandArea';
import PlayerMoves from '../components/PlayerMoves';
import DiscardArea from '../components/DiscardArea';
import { DragDropContext } from 'react-beautiful-dnd';
import { UserContext } from '../context';
import firebase from '../firebase';

type MatchParams = {
  roomId: string
}

function GamePage({match} : RouteComponentProps<MatchParams>) {
  // TODO remove useContext
  const userId = useContext(UserContext).userId;
  const roomId = match.params.roomId;

  const [tiles, setTiles] = useState<number[]>([]);
  const [discardTiles, setDiscardedTiles] = useState<number[]>([]);

  useEffect(() => {
    let handUnsub : Function;
    let discardUnsub : Function;

    if (userId && roomId) {
      // TODO separate this to components
      const handRef = firebase.firestore().collection(`rooms/${roomId}/hand`).doc(userId);
      const discardRef = firebase.firestore().collection(`rooms/${roomId}/discarded`).doc(userId);

      handUnsub = handRef.onSnapshot(function(doc) {
        const data = doc.data();
        if (data) {
          const hand = data.tiles;
          if (tiles.length === 0) {
            setTiles(hand);
          } else {
            const newTile = hand.pop();
            setTiles(prevTiles => [...prevTiles, newTile]);
          }
        }
      })

      discardUnsub = discardRef.onSnapshot(function(doc) {
        const data = doc.data();
        if (data) {
          const hand = data.tiles;
          if (tiles.length === 0) {
            setDiscardedTiles(hand);
          } else {
            const newTile = hand.pop();
            setDiscardedTiles(prevTiles => [...prevTiles, newTile]);
          }
        }
      })
    }

    return () => {
      handUnsub && handUnsub();
      discardUnsub && discardUnsub();
    }
  }, [userId, roomId]);

  function updateFirestoreHand(newTiles : number[], newDiscTiles : number[]) {
    const handRef = firebase.firestore().collection(`rooms/${roomId}/hand/`).doc(userId)
    const discardRef = firebase.firestore().collection(`rooms/${roomId}/discarded/`).doc(userId)

    // TODO batch update
    handRef.update({
      tiles: newTiles
    })
    return discardRef.update({
      tiles: newDiscTiles
    })
    .catch(function(error) {
      throw new Error('Could not update hand');
    });
  }

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
      newTiles.splice(destination.index, 0, parseInt(draggableId));

      if (inHand) {
        setTiles(newTiles);
        updateFirestoreHand(newTiles, discardTiles)
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
      secondary.splice(destination.index, 0, parseInt(draggableId));

      if (inHand) {
        updateFirestoreHand(primary, secondary)
        setTiles(primary);
        setDiscardedTiles(secondary);
      } else {
        updateFirestoreHand(secondary, primary)
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
        <DiscardArea tiles={discardTiles} roomId={roomId} userId={userId}/>
        <HandArea tiles={tiles}/>
        <PlayerMoves roomId={roomId}/>
      </div>
    </DragDropContext>
  );
}

export default GamePage;