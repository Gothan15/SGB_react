import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { IP_MAX_ATTEMPTS, IP_BLOCK_DURATION } from "@/firebaseConfig";

export const getClientIP = async () => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Error obteniendo IP:", error);
    return null;
  }
};

export const checkIPBlocked = async () => {
  const ip = await getClientIP();
  if (!ip) return { blocked: false };

  try {
    const ipDocRef = doc(db, "blockedIPs", ip);
    const ipDoc = await getDoc(ipDocRef);

    if (ipDoc.exists()) {
      const ipData = ipDoc.data();
      const currentTime = new Date().getTime();

      if (currentTime < ipData.expiresAt) {
        return { blocked: true, expiresAt: ipData.expiresAt };
      } else {
        // El bloqueo ha expirado, eliminar el documento
        await deleteDoc(ipDocRef);
        return { blocked: false };
      }
    }
    return { blocked: false };
  } catch (error) {
    console.error("Error al verificar si la IP está bloqueada:", error);
    return { blocked: false };
  }
};

export const blockIP = async () => {
  const ip = await getClientIP();
  if (!ip) return;

  const expiresAt = new Date().getTime() + IP_BLOCK_DURATION;
  try {
    const blockData = {
      ip,
      expiresAt,
      attempts: IP_MAX_ATTEMPTS,
      createdAt: new Date().getTime(),
      blocked: true,
    };
    await setDoc(doc(db, "blockedIPs", ip), blockData);
    return blockData;
  } catch (error) {
    console.error("Error al bloquear la IP:", error);
    return null;
  }
};

export const incrementIPAttempts = async () => {
  const ip = await getClientIP();
  if (!ip) return null;

  try {
    const ipDocRef = doc(db, "blockedIPs", ip);
    const ipDoc = await getDoc(ipDocRef);

    if (ipDoc.exists()) {
      const ipData = ipDoc.data();
      const attempts = (ipData.attempts || 0) + 1;

      if (attempts >= IP_MAX_ATTEMPTS) {
        await blockIP();
        return { blocked: true, attempts };
      } else {
        await setDoc(ipDocRef, { ...ipData, attempts });
        return { blocked: false, attempts };
      }
    } else {
      await setDoc(ipDocRef, {
        ip,
        attempts: 1,
        createdAt: new Date().getTime(),
      });
      return { blocked: false, attempts: 1 };
    }
  } catch (error) {
    console.error("Error al incrementar intentos de IP:", error);
    return null;
  }
};

export const isIPBlocked = async () => {
  try {
    const ip = await getClientIP();
    if (!ip) return false;

    const ipDocRef = doc(db, "blockedIPs", ip);
    const ipDoc = await getDoc(ipDocRef);

    if (ipDoc.exists()) {
      const ipData = ipDoc.data();
      const currentTime = new Date().getTime();

      if (currentTime < ipData.expiresAt) {
        return true;
      } else {
        // El bloqueo ha expirado, eliminar el documento
        await deleteDoc(ipDocRef);
      }
    }
    return false;
  } catch (error) {
    console.error("Error al verificar si la IP está bloqueada:", error);
    return false;
  }
};

export const resetIPAttempts = async () => {
  const ip = await getClientIP();
  if (!ip) return;

  try {
    const ipDocRef = doc(db, "blockedIPs", ip);
    await deleteDoc(ipDocRef);
  } catch (error) {
    console.error("Error al resetear intentos de IP:", error);
  }
};
