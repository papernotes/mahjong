import React, { useEffect, useState, useContext } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import firebase, { db } from '../firebase';
import { UserContext } from '../context';
import AppToolbar from '../components/AppToolbar';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import Button from '@material-ui/core/Button';
import ListItem from '@material-ui/core/ListItem';
import Typography from '@material-ui/core/Typography'

type MatchParams = {
  roomId: string
}

function LobbyPage({match} : RouteComponentProps<MatchParams>) {
  const history = useHistory();
  const userId = useContext(UserContext).userId;
  const userCreated = useContext(UserContext).userCreated;
  const roomId = match.params.roomId;
  const [usernames, setUsernames] = useState<string[]>([]);
  const [roomOwner, setRoomOwner] = useState('');

  function startGame() {
    // TODO verify there are 4 users in the lobby in firebase to go to game
    const startGameCall = firebase.functions().httpsCallable('startGame');
    try {
      startGameCall({userId: userId, roomId: roomId})
        .then((res) => {
          history.push('/game/' + roomId + '/game');
        })
        .catch((err) => {
          console.error(err);
        });
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    const ref = db.collection('rooms').doc(roomId);
    const unsubscribe = ref.onSnapshot(function(doc) {
      const data = doc.data();
      if (data) {
        setUsernames(data.usernames);
        setRoomOwner(data.roomOwner);
        console.log(data.startedGame);
        if (data.startedGame) {
          startGame();
        }
      }
    })

    if (roomId && userId) {
      const joinRoom = firebase.functions().httpsCallable('joinRoom');
      try {
        joinRoom({userId: userId, roomId: roomId})
          .then((res) => {
            console.log(res);
          })
          .catch((err) => {
            if (err.code === 'failed-precondition') {
              console.error('Cannot join room - lobby full');
            }
            if (!userId || err.code === 'not-found') {
              history.push('/');
              console.error('Non existent room')
            }
            console.log('Still creating user');
          })
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
        style={{minHeight:'100vh'}}
      >
        <Grid item xs={12}>
          <Paper style={{minWidth: '25vw'}}>
            <Typography variant='h5'>Lobby</Typography>
            {listUsernames()}
          </Paper>
        </Grid>
        <Grid item xs={9}>
            {
              (userId === roomOwner) &&
              <Button onClick={startGame} disabled={usernames.length !== 4}>Start game for everyone</Button>
            }
          </Grid>
      </Grid>
    </div>
  );
}

export default LobbyPage;