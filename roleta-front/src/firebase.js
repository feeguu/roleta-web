// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAtUgQfnlmMCreY6YHF8w_-YDPsGhJJFwM",

  authDomain: "roleta-4d9e6.firebaseapp.com",

  projectId: "roleta-4d9e6",

  storageBucket: "roleta-4d9e6.appspot.com",

  messagingSenderId: "706049847199",

  appId: "1:706049847199:web:b74f718bedd8b3ffcd97aa",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
