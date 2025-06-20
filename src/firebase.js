import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from 'firebase/database'; 

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAV5uZcKTJmD3Nq1dPcRmf06MqImPHtMK4",
  authDomain: "vivi-mesas.firebaseapp.com",
  databaseURL: "https://vivi-mesas-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vivi-mesas",
  storageBucket: "vivi-mesas.firebasestorage.app",
  messagingSenderId: "474281303193",
  appId: "1:474281303193:web:02cf569ee430b664faec08"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços usados
const auth = getAuth(app);
const database = getDatabase(app);

// Exporta os serviços
export { auth, database };