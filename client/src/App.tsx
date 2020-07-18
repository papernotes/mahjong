import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';


function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={HomePage}/>
        <Route exact path="/game/:roomId/lobby" component={LobbyPage}/>
        <Route exact path="/game/:roomId/game" component={GamePage}/>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
