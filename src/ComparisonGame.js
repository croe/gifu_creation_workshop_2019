import React, {useCallback, useState, useEffect, useRef} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Typography, Button } from '@material-ui/core';
import Header from './Header';
import Grid from '@material-ui/core/Grid';
import Modal from 'react-modal';
import QRReader from 'react-qr-reader';
import {fStore, users} from "./blockchain";
import _ from 'lodash';
import game1Events from './game1_events';

// FIXME: リセット機能が欲しい

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
    textAlign: "center",
    width: "100%",
  },
});

const ComparisonGame = props => {
  // States
  const { classes, user, block, tx, store, accounts } = props;
  const [infoOpened, setInfoOpened] = useState(false);
  const [initOpened, setInitOpened] = useState(true);
  const [currentPlayers, setPlayers] = useState([]);
  const [myStatus, setMyStatus] = useState({
    game1_str: 10,
    game1_int: 5,
    game1_love: 0,
    game1_trust: 0,
    game1_idea: 0,
    game1_moral: 0,
    game1_coin: 0
  });
  const [selectedParam, setSelectedParam] = useState([]);

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
      game1_room_id: refsInputRoomId.current.value,
      game1_state: "ready",
      game1_role_value: 0
    })}, [user]);
  const gameToInit = useCallback(() => {
    // 職業カードの情報を表示し、要件時間を設定。
    users.doc(user.uid).update({
      game1_state: "start"
    });
    closeInitModal();
  }, [user]);
  const getParam = useCallback((param) => {
    if (param === 'int') {
      users.doc(user.uid).update({
        game1_int: (myStatus.game1_int || 0) + 1
      })
    }
    if (param === 'str') {
      users.doc(user.uid).update({
        game1_str: (myStatus.game1_str || 0) + 1
      })
    }
  }, [myStatus]);
  const getEvent = useCallback(data => {
    // 読んだカードとイベントを一致させて選択肢をランダムに選ぶ
    const event = _.filter(game1Events.events, o => o.assetId === data)[0];
    const sampling = _.sample(event.data);
    window.alert(sampling.sub);
    if (event.category === 'love') {users.doc(user.uid).update({
      game1_love: (myStatus.game1_love || 0) + sampling.val
    })}
    if (event.category === 'trust') {users.doc(user.uid).update({
      game1_trust: (myStatus.game1_trust || 0) + sampling.val
    })}
    if (event.category === 'moral') {users.doc(user.uid).update({
      game1_moral: (myStatus.game1_moral || 0) + sampling.val
    })}
    if (event.category === 'idea') {users.doc(user.uid).update({
      game1_idea: (myStatus.game1_idea || 0) + sampling.val
    })}
  }, [myStatus]);
  const verifyGoal = useCallback(asset => {
    const _verify = [
      {game1_str: parseInt(asset.game1_str) || 0 },
      {game1_int: parseInt(asset.game1_int) || 0 },
      {game1_love: parseInt(asset.game1_love) || 0 },
      {game1_trust: parseInt(asset.game1_trust) || 0 },
      {game1_moral: parseInt(asset.game1_moral) || 0 },
      {game1_idea: parseInt(asset.game1_idea) || 0 },
    ];
    const keys = [
      "game1_str","game1_int","game1_love","game1_trust","game1_moral","game1_idea",
    ];
    const judge = _verify.map((v,i)=>{
      const _key = Object.keys(v)[0];
      return myStatus[keys[0]] >= v[_key]
    });
    console.log(_.uniq(judge));
    if (_.includes(judge, false)) {
      window.alert('まだゴールできません！');
    } else {
      window.alert('おめでとうございます！');
    }
  }, [myStatus]);
  const reset = useCallback(() => {
    users.doc(user.uid).update({
      game1_str: 10,
      game1_int: 5,
      game1_love: 0,
      game1_trust: 0,
      game1_idea: 0,
      game1_moral: 0,
      game1_coin: 0
    })
  }, [users, user]);
  const selectParam = useCallback((param)=>{
    console.log(param);
    const array = selectedParam;
    array.push(param);
    setSelectedParam(array);
    if (selectedParam.length > 1) {
      console.log([myStatus[selectedParam[0]], myStatus[selectedParam[1]]],[myStatus[selectedParam[1]], myStatus[selectedParam[0]]]);
      const swapArray = [myStatus[selectedParam[0]], myStatus[selectedParam[1]]] = [myStatus[selectedParam[1]], myStatus[selectedParam[0]]];
      myStatus[selectedParam[0]] = swapArray[0];
      myStatus[selectedParam[1]] = swapArray[1];
      setMyStatus(myStatus);
      setSelectedParam([]);
      console.log([myStatus[selectedParam[0]], myStatus[selectedParam[1]]],[myStatus[selectedParam[1]], myStatus[selectedParam[0]]]);
    }
  }, [selectedParam]);

  /**
   * QR Handler
   */
  const handleScan = data => {
    if (data) {
      const matchAssets = _.filter(store, o => o.data().assetId === data)[0].data();
      console.log(matchAssets);
      switch (matchAssets.game1_rule_id) {
        case '1': getParam('str');
          return closeInfoModal();
        case '2': getParam('int');
          return closeInfoModal();
        case '3': getEvent(data);
          return closeInfoModal();
        case '4': verifyGoal(matchAssets);
        default : return closeInfoModal();
      }
    }
  };
  const handleError = err => console.log(err);

  useEffect(()=>{
    const accountStatus = () => {
      if (accounts) {
        const myStatus = accounts.filter(o => o.id === user.uid)[0].data();
        setMyStatus(myStatus);
        console.log(myStatus);
      }
    };
    return accountStatus();
  }, [accounts, user, store]);

  useEffect(() => {
    const swapSelectedParams = () => {
      console.log(selectedParam);

    };
    return swapSelectedParams();
  }, [selectedParam, myStatus]);

  return (
    <React.Fragment>
      <Header user={user} login="/Login/target/about" />
      <Grid container justify="center" alignItems="center" direction="row" className={classes.root}>
        <Grid className={classes.caption}>
          <Typography>筋力 : {myStatus.game1_str || 0}</Typography>
          <Typography>知力 : {myStatus.game1_int || 0}</Typography>
          <Button color="primary" onClick={openInfoModal}>QRを読む</Button>
        </Grid>
        <Grid className={classes.caption}>
          <Button color="secondary" onClick={reset}>Reset</Button>
        </Grid>
        <Grid>
          <Button color="primary" onClick={() => selectParam('game1_str')} >筋力</Button>
          <Button color="primary" onClick={() => selectParam('game1_int')} >知力</Button>
          <Button color="primary" onClick={() => selectParam('game1_love')} >愛</Button>
          <Button color="primary" onClick={() => selectParam('game1_trust')} >信頼</Button>
          <Button color="primary" onClick={() => selectParam('game1_idea')} >想像力</Button>
          <Button color="primary" onClick={() => selectParam('game1_moral')} >性格</Button>
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
};

ComparisonGame.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ComparisonGame);


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