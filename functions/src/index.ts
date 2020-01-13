import * as functions from 'firebase-functions';
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase)

const db = admin.firestore();
const GM_ADDRESS = '5aAhi08GYmZC8CfabTQRNtBY7D32';
const TESTGAME_GM_ADDRESS = '7DI00ynNSwS8P56SyUsDsG6Rmz52';


export const scheduledFunction = functions.pubsub.schedule('every 1 minutes').onRun((context) => {
  const blockchain = db.collection("blockchain");
  blockchain.doc("block").get()
    .then((doc:any) => {
      blockchain.doc("block").set({
        height: doc.data().height + 1,
        timestamp: Date.now()
      })
    })
    .catch((err:any) => {
      console.log(err);
    });
  console.log('This will be run every 1 minutes!',context);
});

// exports.createAccounts = functions.auth.user().onCreate((user)=>{
//   const accounts = db.collection("users");
//   console.log(user);
//   accounts.doc(user.uid).set({
//     id: user.uid
//   })
// });

export const tokyo2040_getAssets = functions.https.onCall((data, context) => {
  /**
   * argument
   * -from
   * -to
   *
   * TODO: そのアセットを誰も持っていないことを確認
   * TODO: もらう人当てにGMからTXを発行する（信用なし）
   * TODO: Storageから情報を拾ってきて付与
   */
  const s5e = db.collection('storages');
  const t10s = db.collection('transactions');
  s5e.get()
    .then((querySnapshot:any) => {
      querySnapshot.forEach((doc:any) => {
        if (doc.data().assetId === data) {
          const tx = {
            timestamp: Date.now(),
            blockNumber: data.blockNumber,
            from: GM_ADDRESS,
            to: data.uid,
            input: doc.data(),
            value: 0
          };
          t10s.add(tx);
        }
      });
    })
    .catch((err:any) => {
      return err;
    });
  // FIXME: 成功・失敗判定を返す -> Txに記録されなければエラー？
});

export const tokyo2040_sendAssets = functions.https.onCall((data, context) => {
  /**
   * argument
   * -from
   * -to
   *
   * TODO: そのアセットを所持している場合に、所有権を移転するTXを発行
   * TODO: 所有確認 -> FIXME: 盗みができないようにする
   * TODO: 移転させたユーザーに信用度を与えるTXを発行
    */
  const t10s = db.collection('transactions');
  const trustTx = {
    timestamp: Date.now(),
    blockNumber: data.blockNumber,
    from: GM_ADDRESS,
    to: data.uid,
    input: {
      gameType: 'tokyo2040',
      trust: 2
    },
    value: 0
  };
  t10s.add(data);
  t10s.add(trustTx);
  // FIXME: 成功・失敗判定を返す
});

export const tokyo2040_challengeMission = functions.https.onCall((data, context) => {
  /**
   * argument
   * -from
   * -to
   *
   * TODO: そのアセットを所持している場合に、所有権を移転するTXを発行
   * TODO: 所有確認 -> FIXME: 盗みができないようにする
   * TODO: 移転させたユーザーに信用度を与えるTXを発行
   */
});

export const testgame_getResource = functions.https.onCall((data, context) =>{
  /**
   * argument
   * -from
   * -to
   *
   * TODO: そのアセットを所持している場合に、所有権を移転するTXを発行
   * TODO: 所有確認 -> FIXME: 盗みができないようにする
   * TODO: 移転させたユーザーに信用度を与えるTXを発行
   */
  const t10s = db.collection('transactions');
  const tx = {
    timestamp: Date.now(),
    blockNumber: data.blockNumber,
    from: TESTGAME_GM_ADDRESS,
    to: data.to,
    input: {
      assetId: data.input.assetId
    },
    value: 0
  };
  t10s.add(tx);
});

export const timetx_getResource = functions.https.onCall((data, context) =>{
  /**
   * argument
   * -from
   * -to
   *
   * TODO: そのアセットを所持している場合に、所有権を移転するTXを発行
   * TODO: 所有確認 -> FIXME: 盗みができないようにする
   * TODO: 移転させたユーザーに信用度を与えるTXを発行
   */
  const t10s = db.collection('transactions');
  const tx = {
    timestamp: Date.now(),
    blockNumber: data.blockNumber,
    from: GM_ADDRESS,
    to: data.to,
    input: {
      assetId: data.input.assetId
    },
    value: 0
  };
  t10s.add(tx);
});