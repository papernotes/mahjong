import React, { Component } from 'react';
import socketIOClient from 'socket.io-client';

type AppProps = {

}

type AppState = {
  connections: number,
  count: number
}

const socket = socketIOClient('http://localhost:3001/');

class App extends Component<AppProps, AppState> {

  constructor(props: AppProps) {
    super(props);
    this.state = {
      connections: 0,
      count: 0
    }
  }

  incrementCount = () => {
    socket.emit('increment count', () => {});
  }

  componentDidMount() {
    // subscribe to the update count
    socket.on('update count', (count: number) => this.setState({count}));
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
