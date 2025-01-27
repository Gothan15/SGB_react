// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions"); // Agregar esta importación
// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getDatabase } = require("firebase-admin/database");
const admin = require("firebase-admin");

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

    // Asignar rol personalizado inmediatamente
    if (data.role === "student") {
      await admin.auth().setCustomUserClaims(userRecord.uid, { student: true });
    } else if (data.role === "atm") {
      await admin.auth().setCustomUserClaims(userRecord.uid, { atm: true });
    } else if (data.role === "admin") {
      await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    }

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
    console.error("Error en createUser:", error);
    throw new Error(error.message);
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

// Nueva función para resetear intentos
exports.resetLoginAttempts = onCall(async ({ data }) => {
  const { email, ip } = data;
  const db = admin.firestore();

  try {
    // Resetear intentos de email incluyendo blockLevel
    await db.collection("loginAttempts").doc(email).set({
      attempts: 0,
      lockedUntil: null,
      blockLevel: 1, // Resetear el nivel de bloqueo
      lastAttempt: Date.now(),
      ip: ip,
    });

    // Resetear intentos de IP
    await db.collection("ipAttempts").doc(ip).set({
      attempts: 0,
      blockedUntil: null,
      lastAttempt: Date.now(),
      permanent: false, // Asegurarse de que no está marcado como bloqueo permanente
    });

    return { success: true };
  } catch (error) {
    console.error("Error reseteando intentos:", error);
    throw new Error("Error al resetear intentos de login");
  }
});

// Modificar checkIpAttempts para incluir parámetro de éxito
exports.checkIpAttempts = onCall(async ({ data }) => {
  const { ip, success } = data;

  // Si el login fue exitoso, resetear intentos y retornar
  if (success) {
    await admin.firestore().collection("ipAttempts").doc(ip).set({
      attempts: 0,
      blockedUntil: null,
      lastAttempt: Date.now(),
    });
    return { blocked: false };
  }

  // Resto de la lógica existente para intentos fallidos
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

// Modificar checkEmailLock para incluir parámetro de éxito
exports.checkEmailLock = onCall(async ({ data }) => {
  const { email, success } = data;
  const db = admin.firestore();
  const ref = db.collection("loginLock").doc(email);

  // Si el login fue exitoso, resetear intentos y retornar
  if (success) {
    await ref.set({
      attempts: 0,
      blockedUntil: null,
    });
    return { blocked: false };
  }

  // Resto de la lógica existente
  const BLOCK_DURATIONS = {
    2: 5 * 60 * 1000, // 5 minutos
    3: 10 * 60 * 1000, // 10 minutos
    4: 30 * 60 * 1000, // 30 minutos
  };

  const MAX_ATTEMPTS = 4;

  const docSnap = await ref.get();
  const now = Date.now();

  if (docSnap.exists) {
    const lockData = docSnap.data();

    // Verificar si está bloqueado actualmente
    if (lockData.blockedUntil && lockData.blockedUntil > now) {
      return {
        blocked: true,
        remainingTime: lockData.blockedUntil - now,
      };
    }

    // Si ya pasó el tiempo de bloqueo, reiniciar intentos
    if (lockData.blockedUntil && lockData.blockedUntil <= now) {
      await ref.set({
        attempts: 1,
        blockedUntil: null,
      });
      return { blocked: false };
    }

    const newAttempts = (lockData.attempts || 0) + 1;

    // Si alcanzó o superó el máximo de intentos
    if (newAttempts >= MAX_ATTEMPTS) {
      await ref.set({
        attempts: newAttempts,
        blockedUntil: now + BLOCK_DURATIONS[MAX_ATTEMPTS],
      });
      return {
        blocked: true,
        remainingTime: BLOCK_DURATIONS[MAX_ATTEMPTS],
      };
    }

    // Si alcanzó algún umbral de bloqueo
    if (newAttempts >= 2) {
      const blockDuration = BLOCK_DURATIONS[newAttempts];
      await ref.set({
        attempts: newAttempts,
        blockedUntil: now + blockDuration,
      });
      return {
        blocked: true,
        remainingTime: blockDuration,
      };
    }

    // Actualizar contador de intentos
    await ref.set({
      attempts: newAttempts,
      blockedUntil: null,
    });
  } else {
    // Primer intento fallido
    await ref.set({
      attempts: 1,
      blockedUntil: null,
    });
  }

  return { blocked: false };
});

// Reemplazar la función exports.checkExpiringReservations
exports.checkExpiringReservations = onSchedule(
  "0 */12 * * *",
  async (context) => {
    try {
      console.log("Iniciando verificación de préstamos próximos a vencer");

      const db = admin.firestore();
      const now = admin.firestore.Timestamp.now();
      const threeDaysFromNow = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      );

      const usersSnapshot = await db.collection("users").get();
      console.log(`Encontrados ${usersSnapshot.size} usuarios para revisar`);

      for (const userDoc of usersSnapshot.docs) {
        const borrowedBooksRef = userDoc.ref.collection("borrowedBooks");
        console.log(`Verificando libros del usuario ${userDoc.id}`);

        // Consulta modificada para usar el índice correctamente
        const expiringBooks = await borrowedBooksRef
          .where("status", "==", "Prestado")
          .where("dueDate", "<=", threeDaysFromNow)
          .orderBy("dueDate", "asc")
          .get();

        console.log(
          `Encontrados ${expiringBooks.size} libros próximos a vencer`
        );

        if (!expiringBooks.empty) {
          for (const doc of expiringBooks.docs) {
            const reserva = doc.data();
            const diasRestantes = Math.ceil(
              (reserva.dueDate.toDate() - now.toDate()) / (1000 * 60 * 60 * 24)
            );

            if (diasRestantes > 0) {
              // Solo notificar si aún no ha vencido
              try {
                await userDoc.ref.collection("notifications").add({
                  title: "Préstamo por Vencer",
                  message: `Tu préstamo del libro "${reserva.title}" vencerá en ${diasRestantes} días.`,
                  type: "info",
                  read: false,
                  createdAt: now,
                  bookId: reserva.bookId,
                  reservationId: doc.id,
                });
                console.log(
                  `Notificación creada para reserva ${doc.id} - ${diasRestantes} días restantes`
                );
              } catch (notifError) {
                console.error(`Error creando notificación: ${notifError}`);
              }
            }
          }
        }
      }

      console.log(
        "Verificación de préstamos por vencer completada exitosamente"
      );
      return null;
    } catch (error) {
      console.error("Error en checkExpiringReservations:", error);
      return null;
    }
  }
);

// Reemplazar la función exports.checkOverdueReservations
exports.checkOverdueReservations = onSchedule(
  "0 */12 * * *",
  async (context) => {
    try {
      console.log("Iniciando verificación de reservas vencidas");

      const db = admin.firestore();
      const now = admin.firestore.Timestamp.now();

      const usersSnapshot = await db.collection("users").get();
      console.log(`Encontrados ${usersSnapshot.size} usuarios`);

      for (const userDoc of usersSnapshot.docs) {
        const borrowedBooksRef = userDoc.ref.collection("borrowedBooks");
        console.log(`Verificando libros prestados para usuario ${userDoc.id}`);

        // Consulta modificada para usar el nuevo índice
        const overdueBooks = await borrowedBooksRef
          .where("status", "==", "Prestado")
          .where("dueDate", "<=", now)
          .orderBy("dueDate", "asc")
          .get();

        console.log(`Encontrados ${overdueBooks.size} libros vencidos`);

        // Verificar si hay documentos antes de procesar
        if (!overdueBooks.empty) {
          for (const doc of overdueBooks.docs) {
            const reserva = doc.data();
            console.log(`Procesando reserva vencida: ${doc.id}`);

            try {
              await userDoc.ref.collection("notifications").add({
                title: "Préstamo Vencido",
                message: `Tu préstamo del libro "${reserva.title}" ha vencido. Por favor devuélvelo en las próximas 24 horas.`,
                type: "warning",
                read: false,
                createdAt: now,
                bookId: reserva.bookId,
                reservationId: doc.id,
              });
              console.log(`Notificación creada para reserva ${doc.id}`);
            } catch (notifError) {
              console.error(`Error creando notificación: ${notifError}`);
            }
          }
        }
      }

      console.log("Verificación completada exitosamente");
      return null;
    } catch (error) {
      console.error("Error en checkOverdueReservations:", error);
      return null;
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

exports.assignCustomRoles = onCall(async (context) => {
  const db = getFirestore();
  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();

  for (const docSnap of snapshot.docs) {
    const { role } = docSnap.data();
    const uid = docSnap.id;

    try {
      if (role === "student") {
        await admin.auth().setCustomUserClaims(uid, { student: true });
      } else if (role === "atm") {
        await admin.auth().setCustomUserClaims(uid, { atm: true });
      } else if (role === "admin") {
        await admin.auth().setCustomUserClaims(uid, { admin: true });
      }
    } catch (error) {
      console.error(`Error asignando customUserClaims para ${uid}:`, error);
    }
  }

  return { success: true };
});

exports.checkEmailAvailability = onCall(async ({ data }) => {
  try {
    const { email } = data;

    // Obtener todos los usuarios que usan ese email
    const usersQuery = await admin
      .firestore()
      .collection("users")
      .where("email", "==", email)
      .get();

    return {
      isAvailable: usersQuery.empty,
      message: usersQuery.empty
        ? "Correo disponible"
        : "Este correo ya está registrado",
    };
  } catch (error) {
    console.error("Error en checkEmailAvailability:", error);
    throw new Error("Error al verificar disponibilidad del correo");
  }
});

const INITIAL_BLOCK_DURATION = 5 * 60 * 1000; // Duración inicial del bloqueo (5 minutos)
const ATTEMPT_LIMIT = 3; // Límite de intentos fallidos antes de bloquear

exports.handleFailedLogin = onCall(async ({ data }) => {
  const { email, ip } = data;

  if (!email || !ip) {
    throw new Error("El email y la IP son obligatorios.");
  }

  const db = admin.firestore();
  const loginAttemptsRef = db.collection("loginAttempts").doc(email);
  const ipAttemptsRef = db.collection("ipAttempts").doc(ip);

  try {
    const doc = await loginAttemptsRef.get();
    const now = Date.now();

    if (doc.exists) {
      const userData = doc.data();
      const { attempts, lockedUntil, blockLevel = 1 } = userData;

      // Verificar si está bloqueado
      if (lockedUntil && now < lockedUntil) {
        // Asegurar que disabled esté en true mientras está bloqueado
        await loginAttemptsRef.update({ disabled: true });

        const remainingTime = Math.ceil((lockedUntil - now) / 1000);
        return {
          disabled: true,
          message: `Esta cuenta está bloqueada. Intenta de nuevo en ${remainingTime} segundos.`,
        };
      }

      // Si ya pasó el tiempo de bloqueo, actualizar disabled a false
      if (lockedUntil && now >= lockedUntil) {
        await loginAttemptsRef.update({ disabled: false });
      }

      // Si alcanza blockLevel 4, bloquear la IP
      if (blockLevel >= 4) {
        await ipAttemptsRef.set({
          attempts: MAX_FAILED_IP_ATTEMPTS,
          blockedUntil: now + BLOCK_DURATION,
          lastAttempt: now,
          email: email,
          permanent: true,
        });

        return {
          disabled: true,
          message: `Demasiados intentos fallidos. La IP ha sido bloqueada por seguridad.`,
        };
      }

      // Si los intentos fallidos alcanzan el límite
      if (attempts + 1 >= ATTEMPT_LIMIT) {
        const blockDuration =
          INITIAL_BLOCK_DURATION * Math.pow(2, blockLevel - 1);
        await loginAttemptsRef.set({
          attempts: 0,
          lockedUntil: now + blockDuration,
          blockLevel: blockLevel + 1,
          email: email,
          lastAttempt: now,
          ip: ip,
          disabled: true, // Establecer disabled en true al bloquear
        });

        return {
          disabled: true,
          message: `Demasiados intentos fallidos. La cuenta está bloqueada por ${Math.ceil(
            blockDuration / 60000
          )} minutos.`,
        };
      }

      // Incrementar contador de intentos
      await loginAttemptsRef.update({
        attempts: attempts + 1,
        lastAttempt: now,
        ip: ip,
        disabled: false, // Asegurar que disabled esté en false mientras no está bloqueado
      });

      return {
        disabled: false,
        message: `Intento fallido. Te quedan ${
          ATTEMPT_LIMIT - attempts - 1
        } intentos antes del bloqueo.`,
      };
    } else {
      // Primer intento fallido
      await loginAttemptsRef.set({
        attempts: 1,
        lockedUntil: null,
        blockLevel: 1,
        email: email,
        lastAttempt: now,
        ip: ip,
        disabled: false, // Inicialmente no está bloqueado
      });

      return {
        disabled: false,
        message: `Intento fallido. Te quedan ${
          ATTEMPT_LIMIT - 1
        } intentos antes del bloqueo.`,
      };
    }
  } catch (error) {
    console.error("Error manejando intento fallido:", error);
    throw new functions.https.HttpsError(
      error.code || "unknown",
      error.message || "Error en el servidor"
    );
  }
});

// Puedes eliminar o mantener checkIpAttempts como función auxiliar
// ...existing code...
