import * as firebase from "firebase";
import "firebase/firestore";
import config from './config';

firebase.initializeApp(config);
const db = firebase.firestore();

export const GAMEID = 'tokyo2040';
export const FIREBASE_ENDPOINT = 'https://us-central1-tokyo2030-25957.cloudfunctions.net/';

export const SEND_ASSETS_URI = 'tokyo2040_sendAssets';
export const GET_ASSETS_URI = 'tokyo2040_getAssets';
export const CHALLENGE_MISSION_URI = 'tokyo2040_challengeMission';
export const CHANGE_ASSETS_URI = 'tokyo2040_changeAssets';
export const RESET_GAME_URI = 'tokyo2040_reset';

export const GET_TEST_ASSETS = 'testgame_getResource';

export const GET_TIMETX_ASSETS = 'timetx_getResource'

export const users = db.collection("users");
export const transactions = db.collection("transactions");
export const fStore = db.collection("storages");
export const blocks = db.collection("blockchain").doc("block");

export const sendAssets = firebase.functions().httpsCallable(SEND_ASSETS_URI);
export const getAssets = firebase.functions().httpsCallable(GET_ASSETS_URI);
export const challengeMission = firebase.functions().httpsCallable(CHALLENGE_MISSION_URI);
export const getTestAssets = firebase.functions().httpsCallable(GET_TEST_ASSETS);
export const getTimetxAssets = firebase.functions().httpsCallable(GET_TIMETX_ASSETS);