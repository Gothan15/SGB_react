import { useEffect, useState, useRef } from "react";
import { db, auth } from "@/firebaseConfig";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { toast } from "sonner";
import BlockedIPOverlay from "../ui/BlockedIPOverlay";

const IpFetcher = () => {
  const [ip, setIp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockExpiration, setBlockExpiration] = useState(null);
  const ipSaved = useRef(false);
  const [blockedIpDocId, setBlockedIpDocId] = useState(null);

  const handleBlockedIp = (ipAddress) => {
    const errorMessage = `⛔ ERROR DE SEGURIDAD: La IP ${ipAddress} ha sido bloqueada por actividad sospechosa`;
    console.error(errorMessage);
    toast.error("IP Bloqueada", {
      description:
        "Esta dirección IP ha sido bloqueada por motivos de seguridad",
    });

    const blockDuration = 1 * 60 * 1000;
    setBlockExpiration(new Date().getTime() + blockDuration);
    setIsBlocked(true);
  };

  const handleBlockExpiration = async () => {
    try {
      if (blockedIpDocId) {
        await deleteDoc(doc(db, "ips", blockedIpDocId));
        setBlockedIpDocId(null);
        setIsBlocked(false);
        setBlockExpiration(null);
        toast.success("Bloqueo de IP eliminado");
      }
    } catch (error) {
      console.error("Error al eliminar IP bloqueada:", error);
      toast.error("Error al eliminar el bloqueo de IP");
    }
  };

  const checkExistingIp = async (ipAddress, userId) => {
    try {
      const ipsRef = collection(db, "ips");
      const q = query(
        ipsRef,
        where("ip", "==", ipAddress),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setBlockedIpDocId(querySnapshot.docs[0].id);
        handleBlockedIp(ipAddress);
      }
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error verificando IP existente:", error);
      return false;
    }
  };

  const checkExistingIpInCollection = async (ipAddress) => {
    try {
      const ipsRef = collection(db, "ips");
      const q = query(ipsRef, where("ip", "==", ipAddress));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error verificando IP en colección:", error);
      return false;
    }
  };

  useEffect(() => {
    const getIp = async () => {
      if (ipSaved.current) return;

      try {
        const user = auth.currentUser;
        if (!user) {
          console.log("Usuario no autenticado");
          return;
        }

        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setIp(data.ip);

        const exists = await checkExistingIp(data.ip, user.uid);
        if (exists) {
          console.log("IP ya registrada para este usuario");
          ipSaved.current = true;
          return;
        }

        const ipExists = await checkExistingIpInCollection(data.ip);
        if (ipExists) {
          console.log("IP ya registrada en el sistema");
          ipSaved.current = true;
          return;
        }

        const ipData = {
          ip: data.ip,
          userId: user.uid,
          userEmail: user.email,
          timestamp: Timestamp.fromDate(new Date()),
          userAgent: navigator.userAgent,
        };

        const docRef = await addDoc(collection(db, "ips"), ipData);
        console.log("IP guardada con ID:", docRef.id);
        toast.success("IP registrada correctamente");
        ipSaved.current = true;
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error al registrar la IP");
      } finally {
        setLoading(false);
      }
    };

    getIp();
  }, []);

  return isBlocked && blockExpiration ? (
    <BlockedIPOverlay
      remainingTime={blockExpiration}
      onExpiration={handleBlockExpiration}
    />
  ) : null;
};

export default IpFetcher;
