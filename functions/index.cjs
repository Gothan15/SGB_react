// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getDatabase } = require("firebase-admin/database");
const admin = require("firebase-admin");
// const { PASSWORD_CONFIG } = require("firebaseConfig");

initializeApp();
setGlobalOptions({ maxInstances: 10 });

exports.createUser = onCall(async ({ data }) => {
  try {
    // Validar los datos recibidos
    if (!data.email || !data.password || !data.name || !data.role) {
      throw new Error("Faltan datos requeridos");
    }

    // Crear usuario en Authentication
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });

    // Crear documento en Firestore
    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set({
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        memberSince: Timestamp.fromDate(new Date()),
        passwordLastChanged: null, // indica que nunca se ha cambiado
        requiresPasswordChange: true,
        // passwordExpiresAt: Timestamp.fromDate(
        //   new Date(
        //     Date.now() + PASSWORD_CONFIG.MAX_AGE_DAYS * 24 * 60 * 60 * 1000
        //   )
        // ),
      });

    return {
      success: true,
      user: {
        id: userRecord.uid,
        name: data.name,
        email: data.email,
        role: data.role,
      },
    };
  } catch (error) {
    //console.error("Error en createUser:", error);
    //throw new Error(error.message);
  }
});

exports.deleteUser = onCall(async ({ data }) => {
  try {
    // Validar que se reciba el ID del usuario
    if (!data.userId) {
      throw new Error("Se requiere el ID del usuario");
    }

    // Eliminar usuario de Authentication
    await admin.auth().deleteUser(data.userId);

    // Eliminar documento de Firestore
    await admin.firestore().collection("users").doc(data.userId).delete();

    return {
      success: true,
      message: `Usuario ${data.userId} eliminado exitosamente`,
    };
  } catch (error) {
    console.error("Error en deleteUser:", error);
    throw new Error(error.message);
  }
});
