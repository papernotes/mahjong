import React, { useEffect } from "react";
import interact from "interactjs";
import styled from "styled-components";
import io from "socket.io-client";

type DiscardAreaProps = {
  roomId: string;
  playerId: string;
};

const DiscardAreaStyle = styled.div`
  background-color: #ccc;
  border: dashed 4px transparent;
  border-radius: 4px;
  margin: 10px auto 30px;
  padding: 10px;
  width: 80%;
  height: 400px;
`;

const socket = io("http://localhost:3001/");

function DiscardArea({ roomId, playerId }: DiscardAreaProps) {
  useEffect(() => {
    socket.connect();

    socket.on("discardedTile", () =>
      console.log("Successfully discarded tile")
    );

    const i = interact(".discardarea").dropzone({
      accept: ".tile",
      overlap: 0.75,
      ondragleave: (event) => {
        console.log("Emit draw from discard");
      },
      ondrop: (event) => {
        console.log(
          "Emit discardTile()",
          roomId,
          event.relatedTarget.id,
          playerId
        );
        socket.emit("discardTile", {
          roomId,
          tileId: event.relatedTarget.id,
          playerId,
        });
      },
    });

    return () => {
      // TODO needed?
      i.unset();

      socket.removeAllListeners();
      socket.close();
    };
  }, [playerId, roomId]);

  return (
    <DiscardAreaStyle className="discardarea">Discard Area</DiscardAreaStyle>
  );
}

export default DiscardArea;
