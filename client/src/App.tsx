import React, { Component } from 'react';
import socketIOClient from 'socket.io-client';

type AppState = {
  socketId: string,
  playerId: string,
  roomId: string,
  tiles: number[]
}

type Tile = {
  id: string
}

const socket = socketIOClient('http://localhost:3001/');


class App extends Component<{}, AppState> {

  constructor() {
    super({});
    this.state = {
      socketId: '',
      playerId: '',
      roomId: '',
      tiles: []
    }
  }

  drawHead = () => {
    socket.emit('drawHead', {'roomId': this.state.roomId, 'playerId': this.state.playerId});
  }

  drawTail = () => {
    socket.emit('drawTail', {'roomId': this.state.roomId, 'playerId': this.state.playerId});
  }

  superDrawHead = () => {
    for (let i = 0; i < 143; i ++) {
      socket.emit('drawHead', {'roomId': this.state.roomId, 'playerId': this.state.playerId});
    }
  }

  newRoom = () => {
    socket.emit('newRoom', () => {});
  }

  componentDidMount() {
    socket.on('id received', (socketId: any) => this.setState({socketId}));
    socket.on('drewTile', (tileId: number) => {
      const newTiles = this.state['tiles'].concat(tileId);
      this.setState({tiles: newTiles});
    })
    socket.on('cannotDrawHead', (data: any) => console.log('Cannot draw head anymore'));
    socket.on('cannotDrawTail', (data: any) => console.log('Cannot draw tail anymore'));
    socket.on('createdNewRoom', (data: any) => {
      this.setState({
        playerId: data['playerId'],
        roomId: data['roomId']
      })
    })
  }

  generateTiles = () => {
    const listItems = this.state.tiles.map( (tileId) => <li>Tile: {tileId}</li>)
    return listItems;
  }

  render() {
    const listTiles = this.generateTiles();
    return (
      <div>
        <div>{listTiles}</div>
        <button onClick={this.drawHead}>Draw Head</button>
        <button onClick={this.drawTail}>Draw Tail</button>
        <button onClick={this.newRoom}>New Room</button>
        <button onClick={this.superDrawHead}>Super Draw Head - Draws 144 times</button>
      </div>
    );
  }
}

export default App;
