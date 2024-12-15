// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, deleteObject, getDownloadURL } from "firebase/storage";
import { ref } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjfgz3iRpmpv7RURCRYQiDmm9DQqEY-tc",
  authDomain: "ebda-7e856.firebaseapp.com",
  databaseURL: "https://ebda-7e856-default-rtdb.firebaseio.com",
  projectId: "ebda-7e856",
  storageBucket: "ebda-7e856.firebasestorage.app",
  messagingSenderId: "464917728701",
  appId: "1:464917728701:web:a1b97c8f1b8c3d6cef96d4",
  measurementId: "G-Y34NVNFHC8",
};

// Solo en desarrollo - Permite tokens de depuración
// if (process.env.NODE_ENV === "development") {
//   self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
// }
// En el archivo src/firebaseConfig.js
export const PASSWORD_CONFIG = {
  MAX_AGE_DAYS: 90, // máximo 90 días
  MIN_HISTORY: 24, // mínimo 24 contraseñas en historial
  FORCE_FIRST_CHANGE: true,
};

// Configuración de intentos fallidos y bloqueo progresivo
export const MAX_LOGIN_ATTEMPTS = 3; // Número máximo de intentos permitidos
export const BASE_LOCK_DURATION = 5 * 60 * 1000; // 5 minutos base
export const MAX_LOCK_MULTIPLIER = 4; // Máximo multiplicador de bloqueo

// Configuración de tiempo de inactividad de la sesión
export const SESSION_TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutos en milisegundos

// Configuración para notificaciones de contraseña
export const PASSWORD_NOTIFICATION = {
  WARN_DAYS_BEFORE: 15, // Notificar 15 días antes del vencimiento
  CHECK_INTERVAL: 24 * 60 * 60 * 1000, // Revisar cada 24 horas
};

// Tiempo de expiración de la sesión (en milisegundos)
export const SESSION_EXPIRATION_DURATION = 10 * 60 * 1000; // 5 minutos

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Inicializa App Check después de inicializar Firebase
console.log("Iniciando configuración de App Check...");
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LcpypkqAAAAANjqYhsE6expeptIsK1JH6ucYEwE"),
  isTokenAutoRefreshEnabled: true,
});

console.log("App Check configurado:", appCheck ? "Exitoso" : "Fallido");

// Si estás en desarrollo, puedes usar el emulador:
// if (process.env.NODE_ENV === 'development') {
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

export {
  auth,
  db,
  storage,
  analytics,
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  functions,
  appCheck,
};
