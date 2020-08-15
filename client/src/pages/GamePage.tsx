import React, { useEffect, useState, useContext } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { DragDropContext } from 'react-beautiful-dnd';
import { UserContext } from '../context';

import HandArea from '../components/HandArea';
import PlayerMoves from '../components/PlayerMoves';
import DiscardArea from '../components/DiscardArea';
import RevealedArea from '../components/RevealedArea';

import firebase from '../firebase';

type MatchParams = {
  roomId: string;
}

type SharedTileMapping = {
  [uid : string] : number[];
}

function GamePage({match} : RouteComponentProps<MatchParams>) {
  const history = useHistory();
  const userId = useContext(UserContext).userId;
  const roomId = match.params.roomId;

  const [tiles, setTiles] = useState<number[]>([]);
  const [uids, setUids] = useState<string[]>([]);

  const [discardMap, setDiscardMap] = useState<SharedTileMapping>({});
  const [revealedMap, setRevealedMap] = useState<SharedTileMapping>({});
  const [createdMap, setCreatedMap] = useState<boolean>(false);
  const [tilesLeft, setTilesLeft] = useState<number>(-1);

  function updateSharedTileMap(uid : string, newTiles : number[], category : string) {
    if (category === 'discarded') {
      setDiscardMap(prevMap => ({
        ...prevMap,
        [uid]: newTiles
      }));
    } else {
      setRevealedMap(prevMap => ({
        ...prevMap,
        [uid]: newTiles
      }))
    }
  }

  function createSharedTileListener(uid : string, sharedMap : SharedTileMapping, category : string) {
    const ref = firebase.firestore().collection(`rooms/${roomId}/${category}`).doc(uid);
    const sharedUnsub = ref.onSnapshot((doc) => {
      const data = doc.data();
      if (data) {
        const hand = data.tiles;

        if (sharedMap[uid]) {
          if (sharedMap[uid].length === 0) {
            updateSharedTileMap(uid, hand, category);
          } else {
            const newTile = hand.pop();
            const newHand = sharedMap[uid].concat(newTile);
            updateSharedTileMap(uid, newHand, category);
          }
        }
      }
    });

    return sharedUnsub;
  }

  function setSharedTileAreaListeners(uids : string[]) {
    const unsubs : Function[] = [];

    uids.forEach(uid => {
      unsubs.push(createSharedTileListener(uid, discardMap, 'discarded'));
      unsubs.push(createSharedTileListener(uid, discardMap, 'revealed'));
    });
    return unsubs;
  }

  function createSharedTileMap(uids : number[]) {
    const newMap : SharedTileMapping = {};
    uids.forEach(uid => {
      newMap[uid] = [];
    })
    return newMap;
  }

  function spliceUpdate(primary : number[], secondary : number[], sourceIndex : number,
                        destIndex : number, draggableId : string) {
      primary.splice(sourceIndex, 1);
      secondary.splice(destIndex, 0, parseInt(draggableId));
  }

  function newArrayFromSharedTileMap(category : string, uid : string) {
    switch (category) {
      case 'discarded':
        return Array.from(discardMap[uid]);
      case 'revealed':
        return Array.from(revealedMap[uid]);
      default:
        return []
    }
  }

  // TODO make transaction?
  function updateFirestore(newTiles : number[], category : string, userId : string) {
    const handRef = firebase.firestore().collection(`rooms/${roomId}/${category}/`).doc(userId)
    return handRef.update({
      tiles: newTiles
    })
    .catch(function(error) {
      console.error(error);
      throw new Error('Could not update hand');
    })
  }

  // Update Hand <-> (Discard/Revealed)
  function sharedWithHandDragUpdate(primary : number[], secondary: number[], destUserId : string, category : string) {
    updateFirestore(primary, 'hand', userId);
    updateFirestore(secondary, category, destUserId);
    setTiles(primary);
    updateSharedTileMap(destUserId, secondary, category);
  }

  useEffect(() => {
    let handUnsub : Function;
    let countUnsub : Function;

    if (userId && roomId) {
      const userIdRef = firebase.firestore().collection('rooms').doc(roomId);
      userIdRef.get()
        .then((doc) => {
          const data = doc.data();
          if (data) {
            const uids = data.userIds;
            setUids(uids);
            setDiscardMap(createSharedTileMap(uids));
            setRevealedMap(createSharedTileMap(uids));
            setCreatedMap(true);
          } else {
            console.error("No room found");
            history.push('/');
          }
        });

      const handRef = firebase.firestore().collection(`rooms/${roomId}/hand`).doc(userId);
      const countRef = firebase.firestore().collection(`mappings/${roomId}/tilesLeft`).doc('count');
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
      });

      countUnsub = countRef.onSnapshot(function(doc) {
        const data = doc.data();
        if (data) {
          setTilesLeft(data.count);
        }
      })

    }

    return () => {
      handUnsub && handUnsub();
      countUnsub && countUnsub();
    }
  // eslint-disable-next-line
  }, [userId, roomId]);

  useEffect(() => {
    let unsubs : Function[];
    if (createdMap) {
      unsubs = setSharedTileAreaListeners(uids);
    }
    return () => {
      unsubs && unsubs.forEach(func => func());
    }
  // eslint-disable-next-line
  }, [createdMap])

  function onDragEnd(result: any) {
    const { destination, source, draggableId } = result;
    if (!destination) { return }
    if (destination.droppableId === source.draggableId &&
        destination.index === source.index) { return }

    const start = source.droppableId;
    const finish = destination.droppableId;

    const startCategory = start.split('/')[0];
    const endCategory = finish.split('/')[0];

    // Reordering within the same area
    if (start === finish) {
      let newTiles : number[];
      let inHand = startCategory === 'hand';
      let startUserId = start.split('/')[1];

      // Do not allow users reorder if it's not their own revealed area
      if (startCategory === 'revealed' && startUserId !== userId) return;

      if (inHand) {
        newTiles = Array.from(tiles);
      } else {
        newTiles = newArrayFromSharedTileMap(startCategory, startUserId);
      }

      spliceUpdate(newTiles, newTiles, source.index, destination.index, draggableId);

      if (inHand) {
        setTiles(newTiles);
      } else {
        updateSharedTileMap(startUserId, newTiles, startCategory);
      }

      updateFirestore(newTiles, startCategory, startUserId);
    }
    // Dragging from one area to another
    else {
      let primary : number[];
      let secondary : number[];

      // Hand <-> Discard, Hand <-> Revealed
      if (startCategory === 'hand' || endCategory === 'hand') {
        const destUserId = destination.droppableId.split('/')[1]

        // Hand -> Discard, Hand -> Revealed
        if (startCategory === 'hand') {
          if (endCategory === 'revealed' && destUserId !== userId) return;

          primary = Array.from(tiles);
          secondary = newArrayFromSharedTileMap(endCategory, destUserId);

          spliceUpdate(primary, secondary, source.index, destination.index, draggableId);
          sharedWithHandDragUpdate(primary, secondary, destUserId, endCategory);
        }
        // Moving Discard -> Hand or Revealed -> Hand
        else {
          const sourceUserId = source.droppableId.split('/')[1];
          if (startCategory === 'revealed' && sourceUserId !== userId) return;

          primary = newArrayFromSharedTileMap(startCategory, sourceUserId);
          secondary = Array.from(tiles);

          spliceUpdate(primary, secondary, source.index, destination.index, draggableId);
          sharedWithHandDragUpdate(secondary, primary, sourceUserId, startCategory);
        }
      }
    }
  }

  return (
    <DragDropContext
      onDragEnd={onDragEnd}>
      <div>
        <p> Tiles left: {tilesLeft} </p>
        {uids.map( (uid, index) => {
            return <DiscardArea key={index} tiles={discardMap[uid] || []} roomId={roomId} userId={uid}/> }
        )}
        {uids.map( (uid, index) => {
            return <RevealedArea key={index} tiles={revealedMap[uid] || []} userId={uid}/> }
        )}
        <PlayerMoves roomId={roomId}/>
        <HandArea tiles={tiles} userId={userId}/>
      </div>
    </DragDropContext>
  );
}

export default GamePage;