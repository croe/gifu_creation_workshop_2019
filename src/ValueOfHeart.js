import React, {useCallback, useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Typography, Button, Table, Paper, TableBody, TableCell, TableHead, TableRow} from '@material-ui/core';
import Header from './Header';
import Grid from '@material-ui/core/Grid';
import Modal from 'react-modal';
import QRReader from 'react-qr-reader';
import {users, fStore} from "./blockchain";
import game4Works from './game4_works';
import _ from 'lodash';

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
    paddingTop: theme.spacing(2),
  },
  caption: {
    textAlign: "center",
    width: "100%",
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }
});

const modelDiscussion = {
  game4_rule_id: 4,
  game4_ptrn: 1,
  game4_cond: "警察官",
  eval: -1,
  human: 1
}

const ValueOfHeart = props => {
  // States
  const { classes, user, block, tx, store, accounts } = props;
  const [infoOpened, setInfoOpened] = useState(false);
  const [initOpened, setInitOpened] = useState(false);
  const [myStatus, setMyStatus] = useState({
    game4_eventflg: false,
    game4_eval: 0,
    game4_owned: [],
    game4_event_owned: [],
  });

  /**
   * Modal Callbacks
   */
  const openInfoModal = useCallback(() => {setInfoOpened(true)}, []);
  const closeInfoModal = useCallback(() => {setInfoOpened(false)}, []);
  const openInitModal = useCallback(() => {setInitOpened(true)}, []);
  const closeInitModal = useCallback(() => {setInitOpened(false)}, []);

  /**
   * Game Controller
   */
    // FIXME: ？カードの処理をする必要あり。
    // ルームに入る、準備完了する（リセット）
  const gameToReady = useCallback(() => {users.doc(user.uid).update({
      id: user.uid
    })}, [user]);
  const gameToInit = useCallback(() => {
    // 職業カードの情報を表示し、要件時間を設定。
    users.doc(user.uid).update({
      game4_state: "start"
    });
    closeInitModal();
  }, [user]);
  const getHuman = useCallback(data => {
    if (_.filter(store, o => o.data().assetId === data)[0].data().owner === user.uid) {
      fStore.doc(_.filter(store, o => o.data().assetId === data)[0].id).update({
        owner: ""
      });
    } else {
      fStore.doc(_.filter(store, o => o.data().assetId === data)[0].id).update({
        id: _.filter(store, o => o.data().assetId === data)[0].id,
        owner: user.uid
      });
      users.doc(user.uid).update({
        game4_eval: myStatus.game4_eval + parseInt(_.filter(store, o => o.data().assetId === data)[0].data().eval)
      });
    }
  }, [store, users, myStatus]);
  const getEvent = useCallback(data => {
    users.doc(user.uid).update({
      game4_eventflg: true,
      game4_eval: myStatus.game4_eval + parseInt(_.filter(store, o => o.data().assetId === data)[0].data().eval)
    });
  }, [store, users, myStatus]);
  const getPenalty = useCallback(data => {
    users.doc(user.uid).update({
      game4_eval: myStatus.game4_eval + parseInt(_.filter(store, o => o.data().assetId === data)[0].data().eval)
    });
  }, [store, users, myStatus]);

  const getDiscussion = useCallback(data => {
    // 議論カードの処理
    // 評価は加減処理、人材は？カード引く

    if (data.game4_ptrn === "1") {
      // 勝利者が持っていたパターン
      console.log(_.filter(myStatus.game4_owned, o => o.name === data.game4_cond))
      if (_.filter(myStatus.game4_owned, o => o.name === data.game4_cond)){
        users.doc(user.uid).update({
          game4_eval: myStatus.game4_eval + parseInt(_.filter(store, o => o.data().assetId === data.assetId)[0].data().eval)
        });
      }
    } else {
      // 他の誰かが持っていたパターン
      const storeMap = _.filter(store.map(data => data.data()), o => o.game4_rule_id === "1");
      console.log(storeMap);
      console.log(_.filter(storeMap, o => o.name === data.game4_cond && o.owner !== ""))
      if (_.filter(storeMap, o => o.name === data.game4_cond && o.owner !== "").length > 0) {
        users.doc(user.uid).update({
          game4_eval: myStatus.game4_eval + parseInt(data.eval)
        });
      }
    }
  }, [store, users, myStatus]);

  const detectWork = useCallback(work => {
    if (myStatus.game4_eval > work.evaluation && myStatus.game4_owned.length >= work.human) {
      users.doc(user.uid).update({
        game4_eval: myStatus.game4_eval + work.reward
      });
      myStatus.game4_owned.forEach((o,i) => {
        if (i < work.human) {fStore.doc(o.id).update({owner: ""})}
      });
    } else {
      window.alert('条件が揃っていません');
    }
  }, [myStatus]);
  const reset = useCallback(() => {
    users.doc(user.uid).update({
      game4_eval: 0,
      game4_eventflg: false
    });
    // myStatus.game4_owned.map(o => {
    //   fStore.doc(o.id).update({owner: ""});
    // });
    store.map(item => {
      if (item.data().game4_rule_id){
        fStore.doc(item.id).update({owner: ""});
      }
    })
  }, [myStatus, store]);

  /**
   * Works_Creator
   */

  function createData(title,human, evaluation, reward) {
    return { title,human, evaluation, reward };
  }
  const rows = [
    createData("アルバイト", 1,2,2),
    createData("派遣", 2,3,4),
    createData("在宅ワーク", 2,10,5),
    createData("物づくり", 3,5,10),
    createData("施設設営", 4,15,15),
    createData("道路整備", 5,15,17),
    createData("市役所設営", 6,20,23),
  ];

  /**
   * QR Handler
   */
  const handleScan = data => {
    if (data) {
      const matchAssets = _.filter(store, o => o.data().assetId === data)[0].data();
      console.log(matchAssets);
      switch (matchAssets.game4_rule_id) {
        case '1': getHuman(data);
          return closeInfoModal();
        case '2': getEvent(data);
          return closeInfoModal();
        case '3': getPenalty(data);
        case '4': getDiscussion(matchAssets);
          return closeInfoModal();
        default : return closeInfoModal();
      }
    }
  };
  const handleError = err => console.log(err);


  useEffect(() => {
    const accountStatus = () => {
      if (accounts) {
        const myStatus = accounts.filter(o => o.id === user.uid)[0].data();
        myStatus.game4_owned = _.filter(store, o => o.data().owner === user.uid && o.data().gameType === 'game4' ).map(o => o.data());
        myStatus.game4_eval = myStatus.game4_eval || 0;
        setMyStatus(myStatus);
        console.log(myStatus);
      }
    };
    return accountStatus();
  }, [accounts, user, store]);

  return (
    <React.Fragment>
      <Header user={user} login="/Login/target/about" />
      <Grid container justify="center" alignItems="center" direction="row" className={classes.root}>
        <Grid item xs={4}>
          <Paper className={classes.paper}>
            <Typography>現在の評価</Typography>
            <Typography>{myStatus.game4_eval}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper className={classes.paper}>
            <Typography>所有人材</Typography>
            <Typography>{myStatus.game4_owned.length}</Typography>
            <Grid container item className={classes.root} spacing={2} xs={12}>
              {myStatus.game4_owned.map((o,i)=>{
                return (
                  <Paper className={classes.paper} key={i}>{o.name}</Paper>
                )
              })}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper className={classes.paper}>
            <Button color="primary" onClick={openInfoModal}>カードを読む</Button>
          </Paper>
        </Grid>

        <Grid xs={12}>
          <Paper className={classes.root}>
            <Table className={classes.table} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>仕事</TableCell>
                  <TableCell align="right">必要評価</TableCell>
                  <TableCell align="right">必要人材</TableCell>
                  <TableCell align="right">報酬評価</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.title} onClick={() => detectWork(row)}>
                    <TableCell component="th" scope="row">
                      {row.title}
                    </TableCell>
                    <TableCell align="right">{row.human}</TableCell>
                    <TableCell align="right">{row.evaluation}</TableCell>
                    <TableCell align="right">{row.reward}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid className={classes.caption}>
          <Button color="secondary" onClick={reset}>Reset</Button>
        </Grid>
      </Grid>
      <Modal
        isOpen={infoOpened}
        style={modalStyles}
      >
        <Button onClick={closeInfoModal}>x</Button>
        <QRReader
          delay={300}
          onScan={handleScan}
          onError={handleError}
          style={{ width: '100%' }}
        />
      </Modal>
    </React.Fragment>
  );
}

ValueOfHeart.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ValueOfHeart);


// useEffect(()=>{
//   const userStateObserver = () => {
//     const getUserTx = () => _.filter(tx, o => o.data().to === user.uid).map(tx => tx.data());
//     const getAssetsFromTx = userTx => _.filter(userTx, o => o.input.assetId && o.input.assetId).map(tx => tx.input.assetId);
//     const mapAssetsStorage = assets => {
//       if(assets.filter(asset => _.find(store, o => o.data().assetId === asset))) {
//         const result = _.without(assets.map(asset => {
//           if (_.find(store, o => o.data().assetId === asset)) {
//             return _.find(store, o => o.data().assetId === asset).data();
//           }
//         }), undefined);
//         return result;
//       } else {
//         return [{eval: "0", gameType: "test", human: "0", money: "0"}];
//       }
//     };
//     const getGameTypeTestAsset = assets => _.filter(assets, o => o.gameType === 'test');
//
//     const margeUserState = async () => {
//       const userTx = await getUserTx();
//       const userAssets = await getAssetsFromTx(userTx);
//       const userMapStorage = await mapAssetsStorage(userAssets);
//       console.log(userMapStorage)
//       const gTypeFilteredUserAssets = await getGameTypeTestAsset(userMapStorage);
//       const sumEval = await gTypeFilteredUserAssets.reduce((a = {eval:0}, c) => {return { eval: parseInt(a.eval) + parseInt(c.eval)}});
//       const sumHuman = await gTypeFilteredUserAssets.reduce((a = {human:0}, c) => {return { human: parseInt(a.human) + parseInt(c.human) }});
//       setUserState({...sumHuman, ...sumEval});
//     };
//     if (tx && store) {
//       // TODO: TXとStorageから現在の自分の状態を算出する（CLIが処理する？）
//       margeUserState();
//     }
//   };
//   return userStateObserver();
// }, [tx, store]);