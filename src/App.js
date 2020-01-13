import React, { useState, useEffect } from 'react';
import { Route, BrowserRouter as Router } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import theme from './theme';
import Home from './Home';
import About from './About';
import Send from './Send';
import Login from './Login';
import ComparisonGame from './ComparisonGame';
import ValueOfHeart from './ValueOfHeart';
import TimeTransaction from './TimeTransaction';
import RuleBound from './RuleBound';
import Decoder from './Decoder';
import {Provider} from './Context';
import * as firebase from "firebase/app";
import "firebase/firestore";
import {users, blocks, transactions, fStore} from "./blockchain";

function App() {
  const [user, setUser] = useState(null);
  const [block, setBlock] = useState(null);
  const [tx, setTx] = useState(null);
  const [store, setStore] = useState(null);
  const [accounts, setAccounts] = useState(null);

  useEffect(()=>{
    const unregisterAuthObserver = firebase.auth().onAuthStateChanged(
      async (user) => {
        setUser(user);
        if (user) {
          const refUser = users.doc(user.uid);
          const newValue = { lastAccessed:firebase.firestore.FieldValue.serverTimestamp() };
          const doc = (await refUser.get()).data();
          if (!doc || !doc.name) {
            newValue.name = user.displayName;
          }
          await refUser.set(newValue, { merge: true });
        }
      }
    );
    return unregisterAuthObserver;
  }, []);

  useEffect(()=>{
    const blockObserver = blocks.onSnapshot((doc) => {
      console.log(doc.data());
      setBlock(doc.data());
    });
    return blockObserver;
  }, []);

  useEffect(()=>{
    const txObserver = transactions.orderBy("date", "asc").onSnapshot((snapshot)=>{
      setTx(snapshot.docs);
    });
    return txObserver;
  }, []);

  useEffect(()=>{
    const fstoreObserver = fStore.onSnapshot((snapshot)=>{
      setStore(snapshot.docs);
    });
    return fstoreObserver;
  }, []);

  useEffect(()=>{
    const accountsObserver = users.onSnapshot((snapshot) => {
      setAccounts(snapshot.docs);
    });
    return accountsObserver;
  }, []);

  const params = { block, user, tx, store, accounts};
  return (
    <Provider>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Route exact path="/" render={(props) => <Home {...props} {...params} />} />
          <Route exact path="/about" render={(props) => <About {...props} {...params} />} />
          <Route exact path="/send" render={(props) => <Send {...props} {...params} />} />
          <Route exact path="/compari" render={(props) => <ComparisonGame {...props} {...params} />} />
          <Route exact path="/valueof" render={(props) => <ValueOfHeart {...props} {...params} />} />
          <Route exact path="/timetx" render={(props) => <TimeTransaction {...props} {...params} />} />
          <Route exact path="/rulebd" render={(props) => <RuleBound {...props} {...params} />} />
          <Route exact path="/login" render={(props) => <Login {...props} {...params} />} />
          <Route exact path="/login/cmd/:encoded" render={(props) => <Login {...props} {...params} />} />
          <Route exact path="/login/target/:target" render={(props) => <Login {...props} {...params} />} />
          { // We need to mount the Decoder component only after the user info became available.
            (user) ?
              <Route exact path="/decode/:encoded" render={(props) => <Decoder {...props} {...params} />} />
              : ""
          }
        </Router>
      </MuiThemeProvider>
    </Provider>
  );
}

export default App;
