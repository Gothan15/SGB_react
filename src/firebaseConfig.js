
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, deleteObject, getDownloadURL} from "firebase/storage";
import { ref } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxlW-Z9P2NS0TxqCHv4GykNHbnN0_z9KM",
  authDomain: "login-react-firebase-f9406.firebaseapp.com",
  databaseURL: "https://login-react-firebase-f9406-default-rtdb.firebaseio.com",
  projectId: "login-react-firebase-f9406",
  storageBucket: "login-react-firebase-f9406.firebasestorage.app",
  messagingSenderId: "552259136561",
  appId: "1:552259136561:web:b9de3af959dec9f53c7910",
  measurementId: "G-WF26RPK5Q3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app)



//export { auth, db };
export {auth,db,storage,analytics, deleteObject, getDownloadURL, getStorage,ref};