const admin = require("firebase-admin");
const serviceAccount = require("./ebda-7e856-firebase-adminsdk-7s7tw-e317353f08.json");

// Inicializa la app de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ebda-7e856-default-rtdb.firebaseio.com",
  projectId: "ebda-7e856",
});

// Función para verificar los Custom Claims
async function verifyAdminRole(uid) {
  try {
    const user = await admin.auth().getUser(uid);
    if (user.customClaims && user.customClaims.admin) {
      console.log(`El usuario ${uid} tiene el rol de administrador.`);
    } else {
      console.log(`El usuario ${uid} NO tiene el rol de administrador.`);
    }
  } catch (error) {
    console.error("Error al verificar el rol de administrador:", error);
  } finally {
    process.exit();
  }
}

// Reemplaza 'UID_DEL_USUARIO' con el UID del usuario que deseas verificar
verifyAdminRole("FsgIDUihoogcJPvBvPZNTVw82sy2");
