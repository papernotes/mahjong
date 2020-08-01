import React from "react";
import { Droppable } from 'react-beautiful-dnd';
import styled from "styled-components";
import TileList from '../components/TileList';

type DiscardAreaProps = {
  roomId: string;
  userId: string;
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

function DiscardArea({ roomId, userId, tiles }: DiscardAreaProps) {
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
