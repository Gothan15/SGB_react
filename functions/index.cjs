// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getDatabase } = require("firebase-admin/database");
const admin = require("firebase-admin");
// const { PASSWORD_CONFIG } = require("firebaseConfig");
const MAX_FAILED_IP_ATTEMPTS = 5;
const BLOCK_DURATION = 1 * 60 * 60 * 1000; // 5 horas

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

exports.confirmUser = onCall(async ({ data }, context) => {
  // if (!context.auth) {
  //   return { confirmed: false, error: "No hay usuario autenticado" };
  // }

  try {
    const currentUser = await admin.auth().getUser(context.auth.uid);

    if (data.email !== currentUser.email) {
      return {
        confirmed: false,
        error: "El email introducido no coincide con tu cuenta actual",
      };
    }

    return { confirmed: true };
  } catch (error) {
    console.error("Error en confirmUser:", error);
    return {
      confirmed: false,
      error: "Error al verificar el email",
    };
  }
});

exports.checkIpAttempts = onCall(async ({ data }) => {
  try {
    const { ip } = data;

    // Referencia a la colección de intentos de IP
    const ipAttemptsRef = admin.firestore().collection("ipAttempts");

    // Buscar registro existente para esta IP
    const ipDoc = await ipAttemptsRef.doc(ip).get();

    if (ipDoc.exists) {
      const ipData = ipDoc.data();

      // Verificar si la IP está bloqueada
      if (ipData.blockedUntil && ipData.blockedUntil > Date.now()) {
        return {
          blocked: true,
          remainingTime: ipData.blockedUntil - Date.now(),
        };
      }

      // Incrementar intentos fallidos
      const newAttempts = (ipData.attempts || 0) + 1;

      if (newAttempts >= MAX_FAILED_IP_ATTEMPTS) {
        // Bloquear IP
        await ipAttemptsRef.doc(ip).set({
          attempts: 0,
          blockedUntil: Date.now() + BLOCK_DURATION,
          lastAttempt: Date.now(),
        });

        return {
          blocked: true,
          remainingTime: BLOCK_DURATION,
        };
      }

      // Actualizar intentos
      await ipAttemptsRef.doc(ip).set({
        attempts: newAttempts,
        lastAttempt: Date.now(),
      });
    } else {
      // Primer intento fallido
      await ipAttemptsRef.doc(ip).set({
        attempts: 1,
        lastAttempt: Date.now(),
      });
    }

    return { blocked: false };
  } catch (error) {
    console.error("Error en checkIpAttempts:", error);
    throw new Error("Error al verificar intentos de IP");
  }
});

exports.checkExpiringReservations = onSchedule(
  "every 24 hours",
  async (context) => {
    try {
      const db = getFirestore();
      const now = admin.firestore.Timestamp.now();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Obtener todas las reservas activas
      const reservasSnapshot = await db
        .collectionGroup("borrowedBooks")
        .where("status", "==", "active")
        .get();

      const notificacionesEnviadas = [];

      for (const doc of reservasSnapshot.docs) {
        const reserva = doc.data();
        const userId = doc.ref.parent.parent.id; // Obtiene el ID del usuario
        const dueDate = reserva.dueDate.toDate();

        // Verificar si vence en 3 días
        if (dueDate <= threeDaysFromNow && dueDate > now.toDate()) {
          // Crear notificación
          const notificationRef = db
            .collection("users")
            .doc(userId)
            .collection("notifications");

          await notificationRef.add({
            title: "Reserva próxima a vencer",
            message: `Tu préstamo del libro "${reserva.title}" vence en 3 días`,
            type: "warning",
            read: false,
            createdAt: now,
            bookId: reserva.bookId,
            reservationId: doc.id,
          });

          notificacionesEnviadas.push({
            userId,
            bookTitle: reserva.title,
            dueDate,
          });
        }
      }

      console.log("Notificaciones enviadas:", notificacionesEnviadas.length);
      return { success: true, notificacionesEnviadas };
    } catch (error) {
      console.error("Error en checkExpiringReservations:", error);
      throw new Error("Error al verificar reservas por vencer");
    }
  }
);

exports.checkOverdueReservations = onSchedule(
  "every 24 hours",
  async (context) => {
    try {
      const db = getFirestore();
      const now = admin.firestore.Timestamp.now();
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      // Obtener reservas vencidas
      const reservasSnapshot = await db
        .collectionGroup("borrowedBooks")
        .where("status", "==", "active")
        .where("dueDate", "<=", now)
        .get();

      for (const doc of reservasSnapshot.docs) {
        const reserva = doc.data();
        const userId = doc.ref.parent.parent.id;
        const dueDate = reserva.dueDate.toDate();

        // Si la reserva venció hace más de 24 horas, banear usuario
        if (dueDate <= oneDayAgo) {
          // Banear usuario
          await admin.auth().updateUser(userId, {
            disabled: true,
          });

          // Actualizar documento del usuario
          await db.collection("users").doc(userId).update({
            status: "banned",
            bannedAt: now,
            banReason: "Libro no devuelto a tiempo",
          });

          // Notificar ban
          await db
            .collection("users")
            .doc(userId)
            .collection("notifications")
            .add({
              title: "Usuario Baneado",
              message: `Tu cuenta ha sido suspendida por no devolver el libro "${reserva.title}" a tiempo`,
              type: "alert",
              read: false,
              createdAt: now,
            });
        } else {
          // Primera notificación de vencimiento
          await db
            .collection("users")
            .doc(userId)
            .collection("notifications")
            .add({
              title: "Reserva Vencida",
              message: `Tu préstamo del libro "${reserva.title}" ha vencido. Tienes 24 horas para devolverlo o tu cuenta será suspendida`,
              type: "danger",
              read: false,
              createdAt: now,
              bookId: reserva.bookId,
              reservationId: doc.id,
            });
        }
      }

      return { success: true, processed: reservasSnapshot.size };
    } catch (error) {
      console.error("Error en checkOverdueReservations:", error);
      throw new Error("Error al procesar reservas vencidas");
    }
  }
);
// Cloud Function para notificar nuevo libro
exports.notifyNewBook = onDocumentCreated("books/{bookId}", async (event) => {
  try {
    const db = getFirestore();
    const newBook = event.data.data(); // Datos del nuevo libro
    const now = admin.firestore.Timestamp.now();

    // Obtener todos los usuarios
    const usersSnapshot = await db.collection("users").get();

    // Crear las notificaciones en batch para mejor rendimiento
    const batch = db.batch();

    // Crear notificación para cada usuario
    usersSnapshot.docs.forEach((userDoc) => {
      const notificationRef = db
        .collection("users")
        .doc(userDoc.id)
        .collection("notifications")
        .doc(); // Crear nuevo doc con ID automático

      batch.set(notificationRef, {
        title: "¡Nuevo Libro Disponible!",
        message: `Se ha agregado "${newBook.title}" de ${newBook.author} a nuestra biblioteca.`,
        type: "info",
        read: false,
        createdAt: now,
        bookId: event.params.bookId,
        imageUrl: newBook.imageUrl || null,
        category: newBook.category || "No especificada",
      });
    });

    // Ejecutar el batch
    await batch.commit();

    console.log(
      `Notificaciones enviadas a ${usersSnapshot.size} usuarios sobre el nuevo libro: ${newBook.title}`
    );
    return { success: true, notificationsSent: usersSnapshot.size };
  } catch (error) {
    console.error("Error en notifyNewBook:", error);
    throw new Error("Error al notificar sobre nuevo libro");
  }
});
