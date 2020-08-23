import { Droppable } from 'react-beautiful-dnd';
import React from "react";
import TileList from '../components/TileList';
import styled from "styled-components";

type DiscardAreaProps = {
  roomId: string;
  userId: string;
  tiles: number[];
};

const DiscardAreaStyle = styled.div`
  background-color: #ccc;
  border: dashed 4px transparent;
  border-radius: 4px;
  margin: 2px auto 2px;
  display: flex;
  padding: 10px;
  width: 90%;
  overflow-y: scroll;
`;

function DiscardArea({ roomId, userId, tiles }: DiscardAreaProps) {
  return (
    <div>
      <Droppable droppableId={'discarded/' + userId} direction='horizontal' min-width='200'>
        {(provided, snapshot) =>
          <DiscardAreaStyle {...provided.droppableProps} ref={provided.innerRef}>
            <TileList tiles={tiles}/>
            {provided.placeholder}
          </DiscardAreaStyle>
        }
      </Droppable>
    </div>
  );
}

export default DiscardArea;
