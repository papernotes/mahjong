import React from 'react';
import Tile from '../components/Tile';
import styled from "styled-components";

const TileListStyle = styled.div`
  padding: 10px;
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