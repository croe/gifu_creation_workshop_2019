import React, {useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Header from './Header';
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText
} from '@material-ui/core';
import {transactions} from './blockchain';
import Modal from 'react-modal';
import QRReader from 'react-qr-reader';
import _ from 'lodash';
import moment from 'moment';
import CloseIcon from '@material-ui/icons/Close';

const modalStyles = {
  overlay: {
    position: 'fixed',
    zIndex: "100",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  content: {
    position: 'fixed',
    top: "50%",
    left: "50%",
    width: "300px",
    height: "300px",
    transform: "translate(-50%, -50%)"
  }
};

const styles = theme => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(1),
    paddingTop: theme.spacing(10),
  },
  caption: {
    textAlign: "left",
    width: "100%",
  },
});

function Home(props) {
  const { classes, user, block, tx } = props;
  const [opened, setOpened] = useState(false);

  const openModal = useCallback(() => { setOpened(true) }, []);
  const closeModal = useCallback(() => { setOpened(false) }, []);
  const addEmptyTransaction = useCallback(() => {
    generateTxn(user.uid, 0, {assetId: "Dg7Hqh3t18B"});
  },[block, user]);

  const generateTxn = (_to = user.uid, _value = 0, _input = {}) => {
    const rawTxn = {
      timestamp: Date.now(),
      blockNumber: block.height,
      from: user.uid,
      to: _to,
      input: _input,
      value: _value
    };
    transactions.add(rawTxn);
  };
  const handleScan = data => {
    if (data) {
      // transactionsを取得、
      let arrTxn = [];
      transactions.get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
          if (
            'assetId' in doc.data().input &&
            doc.data().input.assetId === data
          ){ arrTxn.push(doc.data()) }
        });
        // Transaction-TimestampとBlock-Timestamp比較
        arrTxn = _.sortBy(arrTxn, [ function(o){ return o.timestamp }]).reverse();
        console.log(arrTxn);
      }).catch(err => console.log(err) );
      setOpened(false);
    }
  };

  const setRankings = txns => {
    let rankings = [];
    if (txns) {
      const users = _.uniq(txns.map(tx => tx.data().to));
      rankings = users.map(user => {
        let userState = {};
        let userValue = txns.reduce((ac,cv)=>{
          if (cv.data().to === user) {
            const prev = typeof ac === 'number' ? ac : 0;
            return prev + cv.data().value;
          } else {
            return 0;
          }
        });
        userState.user = user;
        userState.value = userValue;
        return userState;
      });
    }
    // FIXME: 名前でマッピングしたい
    return _.sortBy(rankings, ['value']).reverse();
  };

  const handleError = err => console.log(err);

  return (
    <React.Fragment>
      <Header user={user} />
      <Typography component="h1" variant="h5">TIMESTAMP: {block && moment(block.timestamp).format("LLLL")}</Typography>
      <Typography component="h1" variant="h5">BLOCK: {block && block.height}</Typography>
      <Grid container justify="center" alignItems="center" direction="row" className={classes.root}>
        <Grid className={classes.caption}>
          <Typography component="h2" variant="h5" gutterBottom>
            Welcome to "TRUSTLESS LIFE TOKYO 2040"
          </Typography>
          <Button onClick={addEmptyTransaction}>add</Button>
          <Button onClick={openModal}>reader</Button>
          {/*<Typography>PLAYER POINTS</Typography>*/}
          {/*<List>*/}
            {/*{*/}
              {/*setRankings(tx).map((rank,idx) => {*/}
                {/*console.log(rank);*/}
                {/*return (*/}
                  {/*<ListItem key={idx}><ListItemText>{rank.user}: {rank.value}</ListItemText></ListItem>*/}
                {/*)*/}
              {/*})*/}
            {/*}*/}
          {/*</List>*/}
          {/*<Typography>MISSION CLEARER</Typography>*/}
        </Grid>
      </Grid>
      <Modal
        isOpen={opened}
        style={modalStyles}
      >
        <div>
          <button onClick={closeModal}><CloseIcon /></button>
          <QRReader
            delay={300}
            onScan={handleScan}
            onError={handleError}
            style={{ width: '100%' }}
          />
        </div>
      </Modal>
    </React.Fragment>
  );
}

Home.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Home);
