import React from 'react';
import styled from "styled-components";
import Tile from '../components/Tile';

const TileListStyle = styled.div`
  padding: 8px;
  display: flex;
`

type TileListProps = {
  tiles: number[];
}

function TileList({tiles} : TileListProps) {
  return (
    <TileListStyle>
      {tiles.map( (tileId, index) => <Tile key={tileId} id={tileId} index={index}/>)}
    </TileListStyle>
  );
}

export default TileList;