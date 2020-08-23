import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import React from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { useHistory } from 'react-router-dom';

function AppToolbar() {
  const history = useHistory();
  return (
      <AppBar position='static'>
        <Toolbar variant='dense'>
            <Typography variant='h6'>
                <Button color='inherit' onClick={() => {history.push('/')}}>Mahjong</Button>
            </Typography>
        </Toolbar>
      </AppBar>
  );
}

export default AppToolbar;