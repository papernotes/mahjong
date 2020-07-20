import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import firebase from '../firebase';


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

  function validateText(e : any) {
    const text = e.target.value;
    if ((text.length < minLength) || (text.length > maxLength)) {
      setInvalidText(true);
    } else {
      setInvalidText(false);
    }
  }

  async function handleCreateNewRoom() {
    const createNewRoom = firebase.functions().httpsCallable('newRoom');
    try {
      createNewRoom().then( (data) => {
        // TODO: on return, set the user's ID?
        // Move the user to the lobby page with the room ID
        history.push('/game/' + data['data']['roomId'] + '/lobby');
      })
    } catch (err) {
      console.log(err);
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
              <Button variant='contained' color='primary' onClick={handleCreateNewRoom}>New Room</Button>
            </Grid>
          </Grid>
        </Paper>
      </div>
    </Grid>

  );
}

export default HomePage;