import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import styled from "styled-components";
import TileList from '../components/TileList';

type RevealedAreaProps = {
  userId: string;
  tiles: number[];
}

const Container = styled.div`
  background-color: ivory;
  border: dashed 4px transparent;
  border-radius: 4px;
  display: flex;
  overflow-y: scroll;
  width: 90%;
  margin: 10px auto 30px;
  padding: 10px;
`

function RevealedArea({tiles, userId} : RevealedAreaProps) {
  return (
    <Droppable droppableId={'revealed/' + userId} direction='horizontal' min-width='200'>
      {(provided, snapshot) =>
        <Container {...provided.droppableProps} ref={provided.innerRef}>
          <TileList tiles={tiles}/>
          {provided.placeholder}
        </Container>
      }
    </Droppable>
  );
}

export default RevealedArea;