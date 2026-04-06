import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBJRlSTsRTXPFaOO_ErgKUOj5ILo8XJNdE",
  authDomain: "gymbro-4d6f4.firebaseapp.com",
  projectId: "gymbro-4d6f4",
  storageBucket: "gymbro-4d6f4.firebasestorage.app",
  messagingSenderId: "513183967049",
  appId: "1:513183967049:web:60801d55af83cecebf5c98",
  measurementId: "G-4Z0FQRNRGP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
