import React, { useContext, useEffect, useState } from 'react';
import firebase, { db } from '../firebase';

import AppToolbar from '../components/AppToolbar';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import { UserContext } from '../context';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(1),
      width: theme.spacing(32),
      height: theme.spacing(32),
    },
  },
}));

function HomePage() {
  const minLength = 2;
  const maxLength = 14;
  const history = useHistory();
  const classes = useStyles();
  const userId = useContext(UserContext).userId;

  const [username, setUsername] = useState('');
  const [invalidText, setInvalidText] = useState(false);
  const [invalidLobby, setInvalidLobby] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lobbyId, setLobbyId] = useState('');

  useEffect( () => {
    let unsubscribe : Function;
    if (userId) {
      const ref = db.collection('users').doc(userId);
      unsubscribe = ref.onSnapshot(doc => {
        const data = doc.data();
        if (data) {
          setUsername(data.username);
        }
      })
    }
    return () => {
      unsubscribe && unsubscribe();
    }
  }, [userId])

  function validateText(e : any) {
    const text = e.target.value;
    setUsername(text);
    if ((text.length < minLength) || (text.length > maxLength)) {
      setInvalidText(true);
    } else {
      setInvalidText(false);
    }
  }

  async function updateUsername() {
    db.collection('users').doc(userId)
      .update({username: username})
      .catch( (error) => {
        console.error("Error", error);
      })
  }

  async function handleCreateNewRoom() {
    setLoading(true);
    const createNewRoom = firebase.functions().httpsCallable('newRoom');
    try {
      if (invalidText) {
        return;
      }
      void updateUsername();
      void createNewRoom({userId: userId, username: username}).then( (data) => {
        history.push('/game/' + data['data']['roomId'] + '/lobby');
      })
    } catch (err) {
      console.log(err);
    }
  }

  function handleJoinLobby() {
    void updateUsername();
    history.push(`/game/${lobbyId}/lobby`);
  }

  function validateLobby(e : any) {
    const text = e.target.value;
    setLobbyId(text);
    if (text.length === 0) {
      setInvalidLobby(true);
    } else {
      setInvalidLobby(false);
    }
  }

  return (
    <div>
      <AppToolbar/>
      <Grid
        container
        spacing={0}
        direction='column'
        alignItems='center'
        justify='center'
        style={{minHeight: '90vh'}}
      >
        <div className={classes.root}>
          <Paper elevation={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  error={invalidText}
                  value={username}
                  onChange={validateText}
                  id='outlined-username'
                  label='Username'
                  variant='outlined'
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  error={invalidText}
                  value={lobbyId}
                  id='outlined-lobby-id'
                  onChange={validateLobby}
                  label='Lobby Id'
                  variant='outlined'
                />
              </Grid>
              <Grid item xs={12}>
                <ButtonGroup>
                  <Button
                    variant='contained'
                    disabled={invalidText}
                    color='primary'
                    onClick={handleCreateNewRoom}
                  >
                    New Room
                  </Button>
                  <Button disabled={invalidText || invalidLobby} onClick={handleJoinLobby}>Join a lobby</Button>
                </ButtonGroup>
              </Grid>
              <Grid item xs={12}>
                {loading && <LinearProgress/>}
              </Grid>
            </Grid>
          </Paper>
        </div>
      </Grid>
    </div>
  );
}

export default HomePage;