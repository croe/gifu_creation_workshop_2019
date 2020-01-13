import React, {useCallback, useState, useRef} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Typography, Button, List, ListItem } from '@material-ui/core';
import Header from './Header';
import Grid from '@material-ui/core/Grid';
import Modal from 'react-modal';
import QRReader from 'react-qr-reader';
import {fStore  , sendAssets} from "./blockchain";

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

const About = props => {
  const { classes, user } = props;
  const [readOpened, setReadOpened] = useState(false);
  const [ruleOpened, setRuleOpened] = useState(false);
  const [infoOpened, setInfoOpened] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [customStorage, setCustomStorage] = useState({});
  const [storage, setStorage] = useState({});

  const inputKey = useRef(null);
  const inputVal = useRef(null);

  const openReaderModal = useCallback(() => { setReadOpened(true) }, []);
  const closeReaderModal = useCallback(() => { setReadOpened(false) }, []);
  const openRuleModal = useCallback(() => {setRuleOpened(true)}, []);
  const closeRuleModal = useCallback(() => {setRuleOpened(false)}, []);
  const openInfoModal = useCallback(() => {setInfoOpened(true)}, []);
  const closeInfoModal = useCallback(() => {setInfoOpened(false)}, []);
  const addNewProperty = useCallback(() => {
    setCustomStorage({...customStorage,[inputKey.current.value]: inputVal.current.value});
  }, [customStorage]);

  const gameTypeInput = useCallback(()=>{
    inputKey.current.value = 'gameType';
    inputVal.current.value = 'test';
  },[]);
  const moneyInput = useCallback(()=>{
    inputKey.current.value = 'money';
    inputVal.current.value = '';
  },[]);
  const evalInput = useCallback(()=>{
    inputKey.current.value = 'eval';
    inputVal.current.value = '';
  },[]);
  const humanInput = useCallback(()=>{
    inputKey.current.value = 'human';
    inputVal.current.value = '';
  },[]);

  const makeAssetRule = useCallback(() => {
    fStore.add(Object.assign({assetId: assetId}, customStorage));
        setRuleOpened(false);
  }, [assetId, customStorage]);
  const sendMetaTransaction = useCallback(() => {
    // let userStatus = [];
    const rawTxn = {
      from: user.uid,
      to: user.uid
    };
    // transactions.get().then((querySnapshot)=>{
    //   userStatus = querySnapshot.docs.map(doc=>{
    //     if (doc.data().to === rawTxn.to) return doc.data();
    //   });
    //   console.log(userStatus);
    // });
    sendAssets(rawTxn).then(function(result) {
      console.log(result)
    });
  },[user]);

  const handleScan = data => {
    if (data) {
      let assetIsExist = false;
      setAssetId(data);
      setCustomStorage({});
      setReadOpened(false);
      fStore.get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            if (doc.data().assetId === data) {
              assetIsExist = true;
              setStorage(doc.data());
            }
          });
          if (!assetIsExist) {
            setRuleOpened(true);
          } else {
            setInfoOpened(true);
          }
        })
        .catch(err => console.log(err));
    }
  };

  const handleError = err => console.log(err);

  return (
    <React.Fragment>
      <Header user={user} login="/Login/target/about" />
      <Grid container justify="center" alignItems="center" direction="row" className={classes.root}>
          <Grid className={classes.caption}>
            <Typography component="h2" variant="h5" gutterBottom>
              カードを受け取る
            </Typography>
            <Button color="primary" onClick={openReaderModal}>reader</Button>
            <Button color="primary" onClick={sendMetaTransaction}>sendTx</Button>
          </Grid>
      </Grid>
      <Modal
        isOpen={readOpened}
        style={modalStyles}
      >
        <div>
          <Button onClick={closeReaderModal}>x</Button>
          <QRReader
            delay={300}
            onScan={handleScan}
            onError={handleError}
            style={{ width: '100%' }}
          />
        </div>
      </Modal>
      <Modal
        isOpen={ruleOpened}
        style={modalStyles}
      >
        <div>
          <Button onClick={closeRuleModal}>x</Button>
          <Button onClick={gameTypeInput}>gameType</Button>
          <Button onClick={evalInput}>eval</Button>
          <Button onClick={humanInput}>human</Button>
          <Button onClick={moneyInput}>money</Button>
          <Typography>AssetID: {assetId}</Typography>
          <Typography>
            key:     <input ref={inputKey} type="text"/><br />
            default: <input ref={inputVal} type="text"/>
            <Button onClick={addNewProperty}>Add</Button>
          </Typography>
          <div>
            <div>
              {
                Object.keys(customStorage).map((key, id) => {
                  console.log(key, id, customStorage);
                  return (
                    <div key={id}>{key}: {customStorage[key]}</div>
                  )
                })
              }
            </div>
          </div>
          <Button onClick={makeAssetRule}>make rule</Button>
        </div>
      </Modal>
      <Modal
        isOpen={infoOpened}
        style={modalStyles}
      >
        <div>
          <Button onClick={closeInfoModal}>x</Button>
          <List>
            {
              Object.keys(storage).map((val, id) => {
                return (
                  <ListItem key={id}>{val}: {storage[val]}</ListItem>
                )
              })
            }
          </List>
        </div>
      </Modal>
    </React.Fragment>
  );
}

About.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(About);
