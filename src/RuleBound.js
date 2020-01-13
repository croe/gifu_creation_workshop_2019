import React, {useCallback, useState, useEffect, useRef} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Typography, Button, GridList } from '@material-ui/core';
import Header from './Header';
import Grid from '@material-ui/core/Grid';
import Modal from 'react-modal';
import QRReader from 'react-qr-reader';
import {fStore, users} from "./blockchain";
import _ from 'lodash';
import game3Words from "./game3_words";
import Timer from 'react-compound-timer';

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
  rootGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
  },
  gridList: {
    width: 300,
    height: 'auto'
  },
});

const RuleBound = props => {
  // States
  const { classes, user, block, tx, store, accounts } = props;
  const [infoOpened, setInfoOpened] = useState(false);
  const [initOpened, setInitOpened] = useState(true);
  const [myStatus, setMyStatus] = useState([]);
  const [myRole, setMyRole] = useState("");
  const [selectedWord, setSelectedword] = useState("");
  const [currentPlayers, setPlayers] = useState([]);

  // Refs
  const refsInputRoomId = useRef(null);
  const refsRule1Timer = useRef([]);

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
  // ルームに入る、準備完了する（リセット）
  const gameToReady = useCallback(() => {users.doc(user.uid).update({
    id: user.uid,
    game3_room_id: refsInputRoomId.current.value,
    game3_role: 1,
    game3_state: "ready",
    game3_count: 0,
    game3_word: "SECRET",
    game3_rule_id: 0,
  })}, [user]);

  // 同じルームに入っているプレイヤーで役職を割り振ってゲームを開始する
  // FIXME: stateがreadyのプレイヤーだけを対象にする
  const gameToInit = useCallback(() => {
    const game3Players = accounts
      .filter(o => o.data().game3_room_id === myStatus.game3_room_id)
      .map(i => i.data());
    const _selectedWord = _.sample(game3Words.words);
    _.shuffle(game3Players).map((u,i) => users.doc(u.id).update({
      game3_role: u.game3_role + i > 3 ? u.game3_role : u.game3_role + i,
      game3_state: "start",
      game3_word: _selectedWord
    }));
  }, [myStatus, accounts]);

  // 質問をするたびにカウントを増やす
  const addGameCount = useCallback(() => {
    users.doc(myStatus.id).update(({
      game3_count: myStatus.game3_count + 1
    }));
  }, [myStatus]);

  // 特殊ルールの処理、結果を全体に通知する
  const logicRule1 = useCallback(() => {
    // ランダムで秒数を決定してルールを生成して返す。
    const randomSeconds = _.random(1,60) * 1000;
    users.doc(myStatus.id).update(({
      game3_rule_id: 1,
      game3_rule_1_count: randomSeconds
    }));
    addGameCount();
  }, [myStatus]);

  const logicRule2 = useCallback(() => {
    const randomColumn = _.sample(['あ','か','さ','た','な','は','ま','や','ら','わ']);
    users.doc(myStatus.id).update(({
      game3_rule_id: 2,
      game3_rule_2_column: randomColumn
    }));
    addGameCount();
  }, [myStatus]);

  const logicRule3 = useCallback(() => {
    const randomColumn = _.sample(['あ','か','さ','た','な','は','ま','や','ら','わ']);
    users.doc(myStatus.id).update(({
      game3_rule_id: 3,
      game3_rule_3_column: randomColumn
    }));
    addGameCount();
  }, [myStatus]);

  const logicRule4 = useCallback(() => {
    const randomSize = _.random(5,10);
    users.doc(myStatus.id).update(({
      game3_rule_id: 4,
      game3_rule_3_column: randomSize
    }));
    addGameCount();
  }, [myStatus])

  /**
   * QR Handler
   */
  const handleScan = data => {
    if (data) {
      /**
       * カード効果が発動する
       */
      const matchAssets = _.filter(store, o => o.data().assetId === data)[0].data();
      console.log(matchAssets);
      switch (matchAssets.game3_rule) {
        case '1': logicRule1();
          return closeInfoModal();
        case '2': logicRule2();
          return closeInfoModal();
        case '3': logicRule3();
          return closeInfoModal();
        case '4': logicRule4();
          return closeInfoModal();
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
        // FIXME: たぶんShuffleしないと順番で役職がバレる？
        const players = accounts.filter(o => o.data().game3_room_id === myStatus.game3_room_id).map(i => i.data())
        setPlayers(players);
      }
    };
    return accountStatus();
  }, [accounts, user]);

  useEffect(()=>{
    const roleObserver = () => {
      switch (myStatus.game3_role) {
        case 2: return setMyRole('Insider');
        case 3: return setMyRole('Master');
        default: return setMyRole('Commons');
      }
    };
    return roleObserver();
  }, [myStatus]);

  useEffect(()=>{
    const wordObserver = () => {
      if (myStatus.game3_role !== 1) {
        setSelectedword(myStatus.game3_word);
      } else {
        setSelectedword("SECRET");
      }
    };
    return wordObserver();
  }, [myStatus]);

  useEffect(() => {
    refsRule1Timer.current = refsRule1Timer.current.slice(0, currentPlayers.length)
  }, [currentPlayers]);

  return (
    <React.Fragment>
      <Header user={user} login="/Login/target/about" />
      <Grid container justify="center" alignItems="center" direction="row" className={classes.root}>
        <Grid className={classes.caption}>
          <Typography component="h2" variant="h5">
            Your Role : {myRole}
          </Typography>
          <Button onClick={openInitModal}>詳細情報を表示する</Button>
          <Button onClick={addGameCount}>質問する</Button>
        </Grid>
        <GridList className={classes.gridList} cols={currentPlayers.length - 1}>
          {currentPlayers.map((p, i) =>
            p.game3_role !==3 ? (
              <div key={p.id}>
                <Typography align="center">{currentPlayers[i].name}</Typography>
                <Typography align="center">{currentPlayers[i].game3_count}</Typography>
                {currentPlayers[i].game3_rule_id === 1 ? (
                    <Timer initialTime={currentPlayers[i].game3_rule_1_count}
                           direction="backward"
                           ref={el => refsRule1Timer.current[i] = el}
                    >
                      <Timer.Seconds />秒間、何度も質問できる。
                    </Timer>): null}
                {currentPlayers[i].game3_rule_id === 2 ? (
                  <Typography>{currentPlayers[i].game3_rule_2_column}行は発言できない</Typography>): null}
                {currentPlayers[i].game3_rule_id === 3 ? (
                  <Typography>{currentPlayers[i].game3_rule_3_column}行しか発言できない</Typography>): null}
                {currentPlayers[i].game3_rule_id === 4 ? (
                  <Typography>{currentPlayers[i].game3_rule_3_column}単語しか発言できない</Typography>): null}
              </div>
            ) : null
          )}
        </GridList>
        <Grid className={classes.caption}>
          <Button onClick={openInfoModal}>QR付きのカードを読み込む</Button>
        </Grid>
      </Grid>
      <Modal
        isOpen={infoOpened}
        style={modalStyles}
      >
        <div>
          <Button onClick={closeInfoModal}>x</Button>
          <QRReader
            delay={300}
            onScan={handleScan}
            onError={handleError}
            style={{ width: '100%' }}
          />
        </div>
      </Modal>
      <Modal isOpen={initOpened} style={modalStyles}>
        <Button onClick={closeInitModal}>X</Button>
        <div>
          <p>Room Number : <input ref={refsInputRoomId} type="text"/></p>
          <Button onClick={gameToReady}>準備完了</Button>
          <Button onClick={gameToInit}>ゲーム開始</Button>
          <p>Joined Room : {myStatus.game3_room_id}</p>
          <p>Game State : {myStatus.game3_state}</p>
          <p>Your Role : {myRole}</p>
          <p>Selected Word : {selectedWord}</p>
        </div>
      </Modal>
    </React.Fragment>
  );
}

RuleBound.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(RuleBound);
