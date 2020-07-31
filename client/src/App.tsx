import React, { useEffect, useState } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import firebase from './firebase';
import { UserContext } from './context';


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

    // TODO cleanup auth
  }, []);

  // TODO make nicer usernames
  function generateUsername() {
    return Math.random().toString(36).substring(7);
  }

  useEffect( () => {
    if (userId) {
      const docRef = firebase.firestore().collection('users').doc(userId)
      docRef.get()
        .then((doc) => {
          if (!doc.exists) {
            docRef.set({
              games: 0,
              username: generateUsername()
            })
            .catch((error) => {
              console.error("Error", error);
            })
          }
        })
    }
  }, [userId])


  return (
    <BrowserRouter>
      <UserContext.Provider value={userId}>
        <Switch>
          <Route exact path="/" component={HomePage}/>
          <Route exact path="/game/:roomId/lobby" component={LobbyPage}/>
          <Route exact path="/game/:roomId/game" component={GamePage}/>
        </Switch>
      </UserContext.Provider>
    </BrowserRouter>
  );
}

export default App;
