import React, { useEffect } from "react";
import { Droppable } from 'react-beautiful-dnd';
import styled from "styled-components";
import TileList from '../components/TileList';
import io from "socket.io-client";

type DiscardAreaProps = {
  roomId: string;
  playerId: string;
  tiles: number[];
};

const DiscardAreaStyle = styled.div`
  background-color: #ccc;
  border: dashed 4px transparent;
  border-radius: 4px;
  margin: 10px auto 30px;
  display: flex;
  padding: 10px;
  width: 100%;
  height: 200px;
`;

const socket = io("http://localhost:3001/");

function DiscardArea({ roomId, playerId, tiles }: DiscardAreaProps) {
  useEffect(() => {
    socket.connect();

    socket.on("discardedTile", () =>
      console.log("Successfully discarded tile")
    );

    return () => {
      socket.removeAllListeners();
      socket.close();
    };
  }, [playerId, roomId]);

  return (
    <Droppable droppableId={'discard'} direction='horizontal'>
      {(provided, snapshot) =>
        <DiscardAreaStyle {...provided.droppableProps} ref={provided.innerRef}>
          <TileList tiles={tiles}/>
          {provided.placeholder}
        </DiscardAreaStyle>
      }
    </Droppable>
  );
}

export default DiscardArea;
