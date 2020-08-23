import React, { useEffect, useState } from 'react';

import { Draggable } from 'react-beautiful-dnd';
import TileUnicode from '../utils/TileUnicode';
import TileUtils from '../utils/TileUtils';
import Tooltip from '@material-ui/core/Tooltip';
import styled from 'styled-components';

type TileProps = {
  id: number;
  index: number;
}

const TileStyle = styled.div`
  width: 47px;
  height: 61.5px;
  background-color: floralwhite;
  border: 3px;
  touch-action: none;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  -webkit-transform: translate(0px, 0px);
          transform: translate(0px, 0px);
`

function Tile(props : TileProps) {
  const [id, setId] = useState(-1);
  const fontSize = 63.3;

  useEffect( () => {
    setId(props.id);
  }, [props.id]);

  function getUnicodeString(tileId : number) {
    if (tileId === -1) return TileUnicode.getBackTile();
    let count;
    let type;
    [count, type] = TileUtils.getTileName(tileId).split('/');
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
          <p style={{fontSize: fontSize}}>{getUnicodeString(id)}</p>
          </TileStyle>
        </Tooltip>
      )}
    </Draggable>
  );
}

export default Tile;