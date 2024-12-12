// const admin = require("firebase-admin");
// const serviceAccount = require("./ebda-7e856-firebase-adminsdk-7s7tw-e317353f08.json");

// // Inicializar la aplicación de administrador con tus credenciales
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://ebda-7e856-default-rtdb.firebaseio.com",
// });

// const uid = "oGKXvotdOqZwnliIy3eOsGXvCl63";

// async function setAdminRole(uid) {
//   try {
//     // Asignar el rol de administrador al usuario
//     await admin.auth().setCustomUserClaims(uid, { role: "admin" });
//     console.log(
//       `Rol de administrador asignado correctamente al usuario ${uid}`
//     );
//   } catch (error) {
//     console.error("Error al asignar rol de administrador:", error);
//   } finally {
//     process.exit();
//   }
// }

// setAdminRole(uid);

const admin = require("firebase-admin");
const serviceAccount = require("./ebda-7e856-firebase-adminsdk-7s7tw-e317353f08.json");

// Inicializa la app de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ebda-7e856-default-rtdb.firebaseio.com",
  projectId: "ebda-7e856", // Asegúrate de especificar el ID de tu proyecto aquí
});

// Función para asignar el rol de administrador
async function assignAdminRole(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(
      `Rol de administrador asignado correctamente al usuario ${uid}`
    );
  } catch (error) {
    console.error("Error al asignar rol de administrador:", error);
  } finally {
    process.exit();
  }
}

// Reemplaza 'UID_DEL_USUARIO' con el UID del usuario al que quieres asignar el rol
assignAdminRole("oGKXvotdOqZwnliIy3eOsGXvCl63");
