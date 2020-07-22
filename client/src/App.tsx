import React, { useEffect, useState } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import firebase from './firebase';
import { PlayerContext } from './context';


function App() {
  const [userId, setUserId] = useState('');

  useEffect( () => {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        setUserId(user.uid);
      } else {
        console.log("user logged out");
      }
    })

    firebase.auth().signInAnonymously().catch(function(err) {
      console.log('error', err)
    })
  }, []);

  useEffect( () => {
    if (userId) {
      firebase.firestore().collection('users').doc(userId)
        .set({games: 0})
        .then( () => {
          console.log("Written");
        })
        .catch( (error) => {
          console.error("Error", error);
        })
    }
  }, [userId])

  return (
    <BrowserRouter>
      <PlayerContext.Provider value={userId}>
        <Switch>
          <Route exact path="/" component={HomePage}/>
          <Route exact path="/game/:roomId/lobby" component={LobbyPage}/>
          <Route exact path="/game/:roomId/game" component={GamePage}/>
        </Switch>
      </PlayerContext.Provider>
    </BrowserRouter>
  );
}

export default App;
