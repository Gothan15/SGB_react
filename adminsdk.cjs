const admin = require("firebase-admin");
const serviceAccount = require("./functions/ebda-7e856-firebase-adminsdk-7s7tw-e317353f08.json"); // Reemplaza 'path/to/serviceAccountKey.json' con la ruta al archivo JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ebda-7e856-default-rtdb.firebaseio.com",
});

admin
  .auth()
  .createUser({
    email: "user@example.com",
    password: "password123",
    displayName: "John Doe",
  })
  .then((userRecord) => {
    console.log("Usuario creado:", userRecord.uid);
  })
  .catch((error) => {
    console.error("Error al crear usuario:", error);
  });
