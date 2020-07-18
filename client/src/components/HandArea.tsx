import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import styled from "styled-components";
import TileList from '../components/TileList';

type HandAreaProps = {
  tiles: number[];
}

const Container = styled.div`
  display: flex;
`

function HandArea({tiles} : HandAreaProps) {
  return (
    <Droppable droppableId={'hand'} direction='horizontal'>
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