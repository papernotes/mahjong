import React, { useEffect, useState } from "react";
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';

function LoadingPage() {
  const flavorTexts = [
    'Shuffling tiles',
    'Opening the 9 Gates',
    'Looking for the Ping and Peng Yous',
    'Creating the easiest hand',
    'Windy day today',
    'Knitting tiles',
    'Saving all the dragons',
    'Looking for green tiles',
    'Adopting 13 orphans'
  ];
  const slowTexts = [
    'really shuffling',
    'picking up tiles from the ground',
    'looking for lost tiles',
    'accidentally flipped a couple tiles',
    'miscounted the wall',
    'one fell on the ground'
  ];
  const [slow, setSlow] = useState(false);

  function randomText(texts : string[]) {
    return texts[Math.floor(Math.random() * texts.length)];
  }

  useEffect(() => {
    setTimeout(() => {
      setSlow(true);
    }, 3000);
  }, [])

  return (
    <Grid
      container spacing={1}
      direction='column'
      alignItems='center'
      justify='center'
      style={{minHeight:'100vh'}}
    >
      <Typography variant='h4'>
        {randomText(flavorTexts)}
      </Typography>
      <CircularProgress/>
      <Typography>
        {slow && `sorry, ${randomText(slowTexts)}`}
      </Typography>
    </Grid>
  );
}

export default LoadingPage;
