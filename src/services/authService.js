// src/services/authService.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const JWT_SECRET = "your_jwt_secret"; // Debes almacenar esto en un entorno seguro

export const login = async (email, password) => {
  const userDocRef = doc(db, "users", email);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    throw new Error("Usuario no encontrado");
  }

  const user = userDoc.data();
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Contraseña incorrecta");
  }

  const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return { token, user };
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Token inválido");
  }
};
