import React, { useEffect, useState } from 'react';
import TileUtils from '../utils/TileUtils';
import TileUnicode from '../utils/TileUnicode';
import styled from 'styled-components';
import { Draggable } from 'react-beautiful-dnd';
import Tooltip from '@material-ui/core/Tooltip';

type TileProps = {
  id: number;
  index: number;
}

const TileStyle = styled.div`
  width: 55px;
  height: 70px;
  background-color: floralwhite;
  border: 3px;
  touch-action: none;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  -webkit-transform: translate(0px, 0px);
          transform: translate(0px, 0px);
`

function Tile(props : TileProps) {
  const [id, setId] = useState(-1);

  useEffect( () => {
    setId(props.id);
  }, [props.id]);

  function getUnicodeString(id : number) {
    if (id === -1) return TileUnicode.getBackTile();
    let count;
    let type;
    [count, type] = TileUtils.getTileName(id).split('/');
    return TileUnicode.getUnicodeString(parseInt(count), type);
  }

  return (
    <Draggable draggableId={id.toString()} key={id} index={props.index}>
      {(provided, snapshot) =>(
        <Tooltip title={TileUtils.getTileName(id)}>
          <TileStyle
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
            className='tile' id={id.toString()}
          >
          <p style={{fontSize: 75}}>{getUnicodeString(id)}</p>
          </TileStyle>
        </Tooltip>
      )}
    </Draggable>
  );
}

export default Tile;