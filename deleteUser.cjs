const admin = require("firebase-admin");
const serviceAccount = require("./ebda-7e856-firebase-adminsdk-7s7tw-e317353f08.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ebda-7e856-default-rtdb.firebaseio.com",
});

// Reemplaza 'UID_DEL_USUARIO' con el ID del usuario que deseas eliminar
const userIdToDelete = "Wi9p7fI6OXS5yG9haCkRIP48vVr1";

admin
  .auth()
  .deleteUser(userIdToDelete)
  .then(() => {
    console.log("Usuario eliminado exitosamente:", userIdToDelete);
  })
  .catch((error) => {
    console.error("Error al eliminar usuario:", error);
  });
