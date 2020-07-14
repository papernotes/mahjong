import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import NewGamePage from './pages/NewGamePage';


function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={HomePage}/>
        <Route exact path="/game/:roomId/:playerId" component={GamePage}/>
        <Route exact path="/new_game" component={NewGamePage}/>
      </Switch>
    </BrowserRouter>

  );
}

export default App;
