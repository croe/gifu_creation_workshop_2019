import React, {useCallback, useState, useEffect, useRef} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Typography, Button, Card, CardContent, CardHeader, Paper } from '@material-ui/core';
import Header from './Header';
import Grid from '@material-ui/core/Grid';
import Modal from 'react-modal';
import QRReader from 'react-qr-reader';
import {fStore, users, transactions} from "./blockchain";
import _ from 'lodash';
import roleWorks from './game2_work';

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
  card: {
    minWidth: 275
  },
  title: {
    fontSize: 14
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }
});

const TimeTransaction = props => {
  // States
  const { classes, user, block, tx, store, accounts } = props;
  const [infoOpened, setInfoOpened] = useState(false);
  const [initOpened, setInitOpened] = useState(false);
  const [myStatus, setMyStatus] = useState([]);
  const [currentPlayers, setPlayers] = useState([]);

  // Refs
  const refsInputRoomId = useRef(null);

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
      id: user.uid,
      game2_room_id: refsInputRoomId.current.value,
      game2_state: "ready",
      game2_role: "",
      game2_role_value: 0
    })}, [user]);
  const gameToInit = useCallback(() => {
    // 職業カードの情報を表示し、要件時間を設定。
    users.doc(user.uid).update({
      game2_state: "start"
    });
    closeInitModal();
  }, [user]);
  const getTime = useCallback(data => {
    const asset = _.filter(store, o => o.data().assetId === data)[0].data();
    // すでに持っている物を読んだ場合は捨てる処理
    if (asset.owner === user.uid) {
      fStore.doc(_.filter(store, o => o.data().assetId === data)[0].id).update({
        owner: "",
        owner_name: "神"
      })
      transactions.add({
        date: Date.now(),
        gameType: "game2",
        game2_tx_from: asset.owner_name,
        game2_tx_to: "神",
        game2_tx_time: asset.game2_time
      })
    } else {
      fStore.doc(_.filter(store, o => o.data().assetId === data)[0].id).update({
        id: _.filter(store, o => o.data().assetId === data)[0].id,
        owner: user.uid,
        owner_name: user.displayName
      })
      transactions.add({
        date: Date.now(),
        gameType: "game2",
        game2_tx_from: asset.owner_name,
        game2_tx_to: user.displayName,
        game2_tx_time: asset.game2_time
      })
    }
  }, [transactions, store]);
  const getEvent = useCallback(data => {
    // すでに持っている物を読んだ場合は捨てる処理
    if (_.filter(store, o => o.data().assetId === data)[0].data().event_owner === user.uid) {
      fStore.doc(_.filter(store, o => o.data().assetId === data)[0].id).update({
        event_owner: ""
      })
    } else {
      fStore.doc(_.filter(store, o => o.data().assetId === data)[0].id).update({
        id: _.filter(store, o => o.data().assetId === data)[0].id,
        event_owner: user.uid
      })
    }
  }, [store]);
  const reset = useCallback(() => {
    myStatus.game2_owned.map(o => {
      fStore.doc(o.id).update({
        owner: "",
        owner_name: "神"
      });
    });
    myStatus.game2_event_owned.map(o => {
      fStore.doc(o.id).update({
        event_owner: ""
      });
    });
    tx.map(item => {
      console.log(item.id);
      transactions.doc(item.id).delete().then(()=>{
        console.log('delete success')
      })
    })
  }, [myStatus]);

  /**
   * QR Handler
   */
  const handleScan = data => {
    if (data) {
      const matchAssets = _.filter(store, o => o.data().assetId === data)[0].data();
      console.log(matchAssets);
      switch (matchAssets.game2_rule_id) {
        case '1': getTime(data);
          return closeInfoModal();
        case '2': getEvent(data);
          return closeInfoModal();
        case '3': return closeInfoModal();
        default : return closeInfoModal();
      }
    }
  };
  const handleScanRole = data => {
    if (data) {
      const matchAssets = _.filter(store, o => o.data().assetId === data)[0].data();
      console.log(matchAssets);
      const readedRole = _.filter(roleWorks, o => o.role === matchAssets.game2_role)[0];
      // ここでStateの変更を行い
      // const roleAssets = _.filter(store, o => o.data().assetId === data)[0].data();
      users.doc(user.uid).update({
        game2_role: readedRole.role,
        game2_role_value: readedRole.works[0].time
      })
    }
  };
  const handleError = err => console.log(err);

  useEffect(()=>{
    const accountStatus = () => {
      if (accounts) {
        const myStatus = accounts.filter(o => o.id === user.uid)[0].data();
        myStatus.game2_owned = _.filter(store, o => o.data().owner === user.uid && o.data().gameType === 'game2').map(o => o.data());
        myStatus.game2_event_owned = _.filter(store, o => o.data().event_owner === user.uid && o.data().gameType === 'game2').map(o => o.data());
        setMyStatus(myStatus);
        console.log(myStatus);
      }
    };
    return accountStatus();
  }, [accounts, user, store]);

  return (
    <React.Fragment>
      <Header user={user} login="/Login/target/about" />
      <Grid container alignitems="stretch" className={classes.root} spacing={2}>
        <Grid item xs={4}>
          <Paper className={classes.paper}>
            <Typography>必須時間 : {myStatus.game2_role_value}</Typography>
            <Button color="primary" onClick={openInitModal}>役割を登録する</Button>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper className={classes.paper}>
            <Typography>総所有時間 : {
              myStatus.game2_owned ? (
                <React.Fragment>
                  {
                    myStatus.game2_owned.length === 0 ? 0 :
                      myStatus.game2_owned.length > 1 ?
                        myStatus.game2_owned.reduce((a,c) => {
                          return {
                            game2_time: parseInt(a.game2_time) + parseInt(c.game2_time)
                          }
                        }).game2_time
                        : myStatus.game2_owned[0].game2_time
                  }
                </React.Fragment>
              ) : 0
            }</Typography>
            <Grid container item className={classes.root} spacing={2} xs={12}>
              {
                myStatus.game2_owned ? myStatus.game2_owned.map(val => {
                  console.log(val);
                  return (
                    <Paper key={val.assetId} className={classes.paper}>{val.game2_time}</Paper>
                  )
                }):null
              }
            </Grid>
            <Button color="primary" onClick={openInfoModal}>時間を登録する</Button>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper className={classes.paper}>
            <Typography>総イベント時間 : {
              myStatus.game2_event_owned ? (
                <React.Fragment>
                  {
                    myStatus.game2_event_owned.length === 0 ? 0 :
                      myStatus.game2_event_owned.length > 1 ?
                        myStatus.game2_event_owned.reduce((a,c) => {
                          return {
                            game2_event_time: parseInt(a.game2_event_time) + parseInt(c.game2_event_time)
                          }
                        }).game2_event_time : myStatus.game2_event_owned[0].game2_event_time
                  }
                </React.Fragment>
              ) : 0
            }</Typography>
            <Grid container item className={classes.root} spacing={2} xs={12}>
              {
                myStatus.game2_event_owned ? myStatus.game2_event_owned.map(val => {
                  console.log(val);
                  return (
                    <Paper key={val.assetId} className={classes.paper}>{val.game2_event_time}</Paper>
                  )
                }):null
              }
            </Grid>
            <Button color="primary" onClick={openInfoModal}>イベントを登録する</Button>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Typography>プレイヤーの時間取引履歴</Typography>
            {
              tx ? tx.map(value => {
                const tx = value.data();
                const from = tx.game2_tx_from === "" ? "神" : tx.game2_tx_from;
                const to = tx.game2_tx_to;
                if (to !== "神") {
                  return (
                    <Typography>{from} から {to} へ {tx.game2_tx_time} 時間の取引がありました</Typography>
                  )
                } else {
                  return (
                    <Typography>{from} は {tx.game2_tx_time} 時間を神に捧げました</Typography>
                  )
                }
              }): null
            }
          </Paper>
        </Grid>
        <Button color="secondary" onClick={reset}>Reset</Button>

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
      <Modal isOpen={initOpened} style={modalStyles}>
        <Button onClick={closeInitModal}>X</Button>
        <div>
          <QRReader
            delay={300}
            onScan={handleScanRole}
            onError={handleError}
            style={{ width: '100%' }}
          />
          <Button onClick={gameToReady}>リセット</Button>
        </div>
      </Modal>
    </React.Fragment>
  );
}

TimeTransaction.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TimeTransaction);


// useEffect(()=>{
//   const userStateObserver = () => {
//     // 全てのTXをAsset基準でマージする
//
//     // const latestAssetTx = () => _.unionBy(tx.map(t => t.data()), 'input.assetID');
//     const latestAssetTx = () => {
//       console.log(tx);
//     }
//     console.log(latestAssetTx());
//     // 最新のAssetsからUserの持つTXを取得する
//     const getUserTx = () => _.reverse(_.sortBy(_.filter(tx, o => o.data().to === user.uid).map(tx => tx.data()), ['timestamp']));
//     // TxからAssetsID一覧を抽出する
//     const getAssetsFromTx = txs => _.filter(txs, o => o.input.assetId && o.input.assetId).map(tx => tx.input.assetId);
//     // AssetsID一覧とStorageを紐付ける
//     const mapAssetsStorage = assets => {
//       if(assets.filter(asset => _.find(store, o => o.data().assetId === asset))) {
//         const result = _.without(assets.map(asset => {
//           if (_.find(store, o => o.data().assetId === asset)) {
//             return _.find(store, o => o.data().assetId === asset).data();
//           }
//         }), undefined);
//         console.log(result);
//         return result;
//       } else {
//         return [{gameType: "timetx", cardType: "time", value: "0"}];
//       }
//     };
//     // Storageと紐付けたAssetsで”TimeTX”のGametypeのものを抽出
//     const getGameTypeTimeTxAsset = assets => _.filter(assets, o => o.gameType === 'timetx');
//
//     const margeUserState = async () => {
//       const userTx = await getUserTx();
//       console.log(userTx);
//       const userAssets = await getAssetsFromTx(userTx);
//       const userMapStorage = await mapAssetsStorage(userAssets);
//       const gTypeFilteredUserAssets = await getGameTypeTimeTxAsset(userMapStorage);
//       console.log(gTypeFilteredUserAssets);
//       // 同じAssetを対象とするTransactionをマージする
//     };
//     if (tx && store) {
//       // TODO: TXとStorageから現在の自分の状態を算出する（CLIが処理する？）
//       margeUserState();
//     }
//   };
//   return userStateObserver();
// }, [tx, store]);

// const handleScan = data => {
//   if (data) {
//     console.log(data);
//     const tx = {
//       blockNumber: block.height,
//       to: user.uid,
//       input: {
//         assetId: data
//       }
//     };
//     console.log(tx);
//     getTimetxAssets(tx);
//     closeInfoModal();
//   }
// };