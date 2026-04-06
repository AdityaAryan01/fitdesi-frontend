// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
 
const firebaseConfig = {
  apiKey: "AIzaSyAICByifCkJ5LSxMfRqgFE5yQ4iYKTMVnM",
  authDomain: "gymbro-f4f1c.firebaseapp.com",
  projectId: "gymbro-f4f1c",
  storageBucket: "gymbro-f4f1c.firebasestorage.app",
  messagingSenderId: "738856192695",
  appId: "1:738856192695:web:3f8fb25acdfae470b01b32"
}
 
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
 