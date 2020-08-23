import { Droppable } from 'react-beautiful-dnd';
import React from 'react';
import TileList from '../components/TileList';
import styled from "styled-components";

type HandAreaProps = {
  userId: string;
  tiles: number[];
}

const Container = styled.div`
  background-color: cornsilk;
  border: dashed 4px transparent;
  border-radius: 4px;
  margin: 2px auto 2px;
  display: flex;
  padding: 10px;
  width: 90%;
  overflow-y: scroll;
`

function HandArea({tiles, userId} : HandAreaProps) {
  return (
    <Droppable droppableId={'hand/' + userId} direction='horizontal' min-width='200'>
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