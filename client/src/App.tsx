import React, { Component } from 'react';
import socketIOClient from 'socket.io-client';

type AppProps = {

}

type AppState = {
  connections: number
  count: number
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      connections: 0,
      count: 0
    }
  }
  incrementConnections = () => {
    this.setState({
      connections: this.state.connections + 1
    });
  }

  incrementCount = () => {
    this.setState({
      count: (this.state.count + 1)
    });
  }

  componentDidMount() {
    // TODO update connection value too all clients
    const socket = socketIOClient('http://localhost:3001/');
    socket.on('my_new_connection', () => this.incrementConnections());
  }

  render() {
    return (
      <div>
        <p>Connections: {this.state.connections}</p>
        <p>Count: {this.state.count}</p>
        <button onClick={this.incrementCount}>Increment Count</button>
      </div>
    );
  }
}

export default App;
