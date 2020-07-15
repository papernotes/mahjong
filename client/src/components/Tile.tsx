import React, { useEffect, useState } from 'react';
import TileUtils from '../utils/TileUtils';

// TODO posisbly take just width and create height from a ratio
type TileProps = {
  id: number
}

function Tile(props : TileProps) {
  const [id, setId] = useState(-1);

  useEffect( () => {
    setId(props.id);
  }, [props.id]);

  return (
    <div>Tile: {id} - {TileUtils.getTileName(id)}</div>
  );
}

export default Tile;