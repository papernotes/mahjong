import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import io from 'socket.io-client';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

const socket = io('http://localhost:3001/');

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
  const [username, setUsername] = useState('');
  const [invalidText, setInvalidText] = useState(true);

  useEffect( () => {
    socket.connect();

    socket.on('createdNewRoom', (data: any) => {
      // history.push('/game/' + data['roomId'] + '/' + data['playerId']);
      history.push('/game/' + data['roomId'] + '/lobby');
    });

    return () => {
      socket.removeAllListeners();
      socket.close();
    }
  }, [history]);

  // TODO send payload with username
  function newRoom() {
    if (!invalidText) {
      socket.emit('newRoom', () => {});
    }
  }

  function validateText(e : any) {
    const text = e.target.value;
    if ((text.length < minLength) || (text.length > maxLength)) {
      setInvalidText(true);
    } else {
      setInvalidText(false);
    }
  }

  return (
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
              <TextField error={invalidText} onChange={e => validateText(e)} id='outlined-basic' label='Username' variant='outlined'/>
            </Grid>
            <Grid item xs={12}>
              <Button variant='contained' color='primary' onClick={newRoom}>New Room</Button>
            </Grid>
          </Grid>
        </Paper>
      </div>
    </Grid>

  );
}

export default HomePage;