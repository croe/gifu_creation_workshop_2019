import React, {useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Typography, Button } from '@material-ui/core';
import Header from './Header';
import Grid from '@material-ui/core/Grid';
import Modal from 'react-modal';
import QRReader from 'react-qr-reader';
import {sendAssets} from "./blockchain";
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
    textAlign: "center",
    width: "100%",
  },
});

const Recieve = props => {
  const { classes, user, block } = props;
  const [readOpened, setReadOpened] = useState(false);
  const [ruleOpened, setRuleOpened] = useState(false);
  const [assetReadOpend, setAssetReadOpend] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [assetId, setAssetId] = useState("");

  const openReaderModal = useCallback(() => { setReadOpened(true) }, []);
  const closeReaderModal = useCallback(() => { setReadOpened(false) }, []);
  const closeRuleModal = useCallback(() => {setRuleOpened(false)}, []);
  const openAssetReadModal = useCallback(() => {setAssetReadOpend(true)}, []);
  const closeAssetReadModal = useCallback(() => {setAssetReadOpend(false)}, []);
  const makeAssetRule = useCallback(() => {
    const rawTxn = {
      timestamp: Date.now(),
      blockNumber: block.height,
      from: user.uid,
      to: receiverId,
      input: {
        assetId: assetId,
      },
      value: 0
    };
    sendAssets(rawTxn);
    setRuleOpened(false);
  }, [receiverId, assetId, block]);

  const handleScanReceiver = data => {
    // もらうデータを読み込み
    if (data) {

      setReadOpened(false);
    }
  };

  const handleScanAssets = data => {
    if (data) {
      setAssetId(data);
      setAssetReadOpend(false);
    }
  };

  const handleError = err => console.log(err);

  return (
    <React.Fragment>
      <Header user={user} login="/Login/target/about" />
      <Grid container justify="center" alignItems="center" direction="row" className={classes.root}>
          <Grid className={classes.caption}>
            <Typography component="h2" variant="h5" gutterBottom>受け取る</Typography>
            <Button color="primary" onClick={openReaderModal}>reader</Button>
          </Grid>
      </Grid>
      <Modal
        isOpen={readOpened}
        style={modalStyles}
      >
        <div>
          <Button onClick={closeReaderModal}><CloseIcon /></Button>
          <QRReader
            delay={300}
            onScan={handleScanReceiver}
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
          <Button onClick={closeRuleModal}><CloseIcon /></Button>
          <Typography>相手のID: {receiverId}</Typography>
          <Typography>送るアイテム: {assetId}</Typography>
          <Button color="secondary" onClick={openAssetReadModal}>送るアイテムを読み込む</Button>
          <Button onClick={makeAssetRule}>送る</Button>
        </div>
      </Modal>
      <Modal
        isOpen={assetReadOpend}
        style={modalStyles}
      >
        <div>
          <Button onClick={closeAssetReadModal}><CloseIcon /></Button>
          <QRReader
            delay={300}
            onScan={handleScanAssets}
            onError={handleError}
            style={{ width: '100%' }}
          />
        </div>
      </Modal>
    </React.Fragment>
  );
}

Recieve.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Recieve);
