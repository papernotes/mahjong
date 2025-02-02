import { BrowserRouter, Route, Switch } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import firebase, { db } from './firebase';

import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import LoadingPage from './pages/LoadingPage';
import LobbyPage from './pages/LobbyPage';
import { UserContext } from './context';

function App() {
  const [userId, setUserId] = useState('');
  const [userCreated ,setUserCreated] = useState(false);

  const newUsername = generateUsername();

  useEffect( () => {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        setUserId(user.uid);
      }
    })

    firebase.auth().signInAnonymously().catch(function(err) {
      console.error('error', err)
    })

  }, [userId]);

  // TODO make nicer usernames
  function generateUsername() {
    return Math.random().toString(36).substring(7);
  }

  useEffect( () => {
    if (userId) {
      const docRef = db.collection('users').doc(userId)
      docRef.get()
        .then((doc) => {
          if (!doc.exists) {
            docRef.set({
              games: 0,
              username: newUsername
            })
            .then((res) => {
              setUserCreated(true);
            })
            .catch((err) => {
              console.error(err);
            });
          }
        })
        .catch((err) => {
          console.error(err);
        })
    }
  }, [userId, newUsername])


  return (
    <BrowserRouter>
      {
        !userId? (
          <LoadingPage/>
        ) :
        (<UserContext.Provider value={{userId: userId, userCreated: userCreated}}>
          <Switch>
            <Route exact path="/" component={HomePage}/>
            <Route exact path="/game/:roomId/lobby" component={LobbyPage}/>
            <Route exact path="/game/:roomId/game" component={GamePage}/>
          </Switch>
        </UserContext.Provider>)
      }
    </BrowserRouter>
  );
}

export default App;
