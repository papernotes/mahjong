import React, { Component } from 'react';
import socketIOClient from 'socket.io-client';

type AppState = {
  count: number,
  socketId: string
}

const socket = socketIOClient('http://localhost:3001/');


class App extends Component<{}, AppState> {

  constructor() {
    super({});
    this.state = {
      count: 0,
      socketId: ''
    }
  }

  incrementCount = () => {
    socket.emit('increment count', () => {});
  }

  componentDidMount() {
    // subscribe to the update count
    socket.on('update count', (count: number) => this.setState({count}));
    socket.on('id received', (socketId: any) => this.setState({socketId}));
  }

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.incrementCount}>Increment Count</button>
      </div>
    );
  }
}

export default App;
