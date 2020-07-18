import React, { useEffect, useState } from 'react';
import TileUtils from '../utils/TileUtils';
import styled from 'styled-components';
import { Draggable } from 'react-beautiful-dnd';

// TODO posisbly take just width and create height from a ratio
type TileProps = {
  id: number;
  index: number;
}

const TileStyle = styled.div`
  width: 75px;
  height: 100px;
  background-color: floralwhite;
  border: 2px solid grey;
  touch-action: none;
  user-select: none;
  -webkit-transform: translate(0px, 0px);
          transform: translate(0px, 0px);
`

// TODO set styles based on getTileName()
function Tile(props : TileProps) {
  const [id, setId] = useState(-1);

  useEffect( () => {
    setId(props.id);
  }, [props.id]);

  return (
    <Draggable draggableId={id.toString()} key={id} index={props.index}>
      {(provided, snapshot) =>(
        <TileStyle
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          className='tile' id={id.toString()}
        >
          Tile: {id} - {TileUtils.getTileName(id)}
        </TileStyle>
      )}
    </Draggable>
  );
}

export default Tile;