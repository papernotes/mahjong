import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import styled from "styled-components";
import TileList from '../components/TileList';

type HandAreaProps = {
  userId: string;
  tiles: number[];
}

const Container = styled.div`
  background-color: cornsilk;
  border: dashed 4px transparent;
  border-radius: 4px;
  display: flex;
  overflow-y: scroll;
  width: 90%;
  margin: 10px auto 30px;
  padding: 10px;
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