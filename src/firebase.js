import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from 'firebase/database'; 

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC8qm6-t7s7TM63oeiXyhE4MKWRkJIJ5J0",
  authDomain: "vivimesas.firebaseapp.com",
  databaseURL: "https://vivimesas-default-rtdb.firebaseio.com",
  projectId: "vivimesas",
  storageBucket: "vivimesas.appspot.com",
  messagingSenderId: "329951800326",
  appId: "1:329951800326:web:7d3ca723ab1b689a142787",
   databaseURL: "https://vivimesas-default-rtdb.europe-west1.firebasedatabase.app",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços usados
const auth = getAuth(app);
const database = getDatabase(app);

// Exporta os serviços
export { auth, database };