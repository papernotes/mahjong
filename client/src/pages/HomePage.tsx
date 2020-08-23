import React, { useState, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import firebase, { db } from '../firebase';
import { UserContext } from '../context';
import AppToolbar from '../components/AppToolbar';
import ButtonGroup from '@material-ui/core/ButtonGroup';

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
    history.push(`/game/${lobbyId}/lobby`);
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
        style={{minHeight: '100vh'}}
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
                  onChange={(e) => setLobbyId(e.target.value)}
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
                  <Button disabled={invalidText} onClick={handleJoinLobby}>Join a lobby</Button>
                </ButtonGroup>
              </Grid>
            </Grid>
          </Paper>
        </div>
      </Grid>
    </div>
  );
}

export default HomePage;