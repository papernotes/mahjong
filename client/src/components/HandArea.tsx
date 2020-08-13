import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import styled from "styled-components";
import TileList from '../components/TileList';

type HandAreaProps = {
  userId: string;
  tiles: number[];
}

const Container = styled.div`
  display: flex;
`

function HandArea({tiles, userId} : HandAreaProps) {
  return (
    <Droppable droppableId={'hand/' + userId} direction='horizontal'>
      {(provided, snapshot) =>
        <Container {...provided.droppableProps} ref={provided.innerRef}>
          <TileList tiles={tiles}/>
          {provided.placeholder}
        </Container>
      }
    </Droppable>
  );
}

export default HandArea;