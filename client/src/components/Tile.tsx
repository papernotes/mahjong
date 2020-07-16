import React, { useEffect, useState } from 'react';
import TileUtils from '../utils/TileUtils';
import interact from 'interactjs';
import styled from 'styled-components';

// TODO posisbly take just width and create height from a ratio
type TileProps = {
  id: number
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

  interact('.tile')
    .draggable({
      modifiers: [
        interact.modifiers.snap({
          targets: [
            interact.createSnapGrid({x: 30, y: 30})
          ],
          range: Infinity,
          relativePoints: [ {x: 0, y: 0}]
        })
      ],
      listeners: {
        move: dragMoveListener
      }
    });

  function dragMoveListener (event : any) {
    var target = event.target
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

    // translate the element
    target.style.webkitTransform =
      target.style.transform =
        'translate(' + x + 'px, ' + y + 'px)'

    target.setAttribute('data-x', x)
    target.setAttribute('data-y', y)
  }

  useEffect( () => {
    setId(props.id);
    return ( () => {
      interact('.tile').unset();
    });
  }, [props.id]);

  return (
    <TileStyle className='tile' id={id.toString()}>
      Tile: {id} - {TileUtils.getTileName(id)}
    </TileStyle>
  );
}

export default Tile;