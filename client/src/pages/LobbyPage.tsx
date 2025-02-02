import React, { useContext, useEffect, useState } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import firebase, { db } from '../firebase';

import AppToolbar from '../components/AppToolbar';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { UserContext } from '../context';

type MatchParams = {
  roomId: string
}

function LobbyPage({match} : RouteComponentProps<MatchParams>) {
  const history = useHistory();
  const userId = useContext(UserContext).userId;
  const userCreated = useContext(UserContext).userCreated;
  const roomId = match.params.roomId;
  const [loading, setLoading] = useState(false);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [roomOwner, setRoomOwner] = useState('');

  function startGame() {
    // TODO verify there are 4 users in the lobby in firebase to go to game
    const startGameCall = firebase.functions().httpsCallable('startGame');
    setLoading(true);
    try {
      startGameCall({userId: userId, roomId: roomId})
        .then((res) => {
          history.push('/game/' + roomId + '/game');
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  useEffect(() => {
    const ref = db.collection('rooms').doc(roomId);
    const unsubscribe = ref.onSnapshot(function(doc) {
      const data = doc.data();
      if (data) {
        setUsernames(data.usernames);
        setRoomOwner(data.roomOwner);
        if (data.startedGame) {
          startGame();
        }
      }
    })

    if (roomId && userId) {
      const joinRoom = firebase.functions().httpsCallable('joinRoom');
      try {
        joinRoom({userId: userId, roomId: roomId})
          .catch((err) => {
            if (err.code === 'failed-precondition') {
              console.error('Cannot join room - lobby full');
            }
            if (!userId || err.code === 'not-found') {
              history.push('/');
              console.error('Non existent room')
            }
          });
      } catch (err) {
        console.error('err');
      }
    }

    // TODO remove user from room
    return () => {
      unsubscribe();
    }
  // eslint-disable-next-line
  }, [roomId, userId, userCreated])

  function listUsernames() {
    if (usernames.length === 0) {
      return '';
    }
    return(
      <List>
        {usernames.map( (username, index) => <ListItem key={index}>{username}</ListItem>)}
      </List>
    )
  }

  return (
    <div>
      <AppToolbar/>
      <Grid
        container spacing={1}
        direction='column'
        alignItems='center'
        justify='center'
        style={{minHeight:'90vh'}}
      >
        <Grid item xs={12}>
          <Paper style={{minWidth: '25vw'}}>
            <Typography variant='h5'>Lobby</Typography>
            {listUsernames() || 'Loading users...'}
          </Paper>
        </Grid>
        <Grid item xs={9}>
            {
              (userId === roomOwner) &&
              <Button onClick={startGame} disabled={usernames.length !== 4}>Start game for everyone</Button>
            }
            { loading && <LinearProgress/> }
          </Grid>
      </Grid>
    </div>
  );
}

export default LobbyPage;