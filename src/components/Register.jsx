/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */

// React y Hooks
import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Firebase
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
  updateDoc,
  collection,
  query,
  getDocs,
  where,
  deleteDoc,
} from "firebase/firestore";
import {
  auth,
  db,
  MAX_LOGIN_ATTEMPTS,
  BASE_LOCK_DURATION,
  MAX_LOCK_MULTIPLIER,
  IP_MAX_ATTEMPTS,
} from "../firebaseConfig";

// Iconos
import { RiArrowRightDoubleFill } from "react-icons/ri";
import { BiUser } from "react-icons/bi";
import {
  AiOutlineUnlock,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import { Github } from "lucide-react";
import { LogIn, UserPlus } from "lucide-react";

// Componentes UI
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Nuevo componente LoadingSpinner
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="relative">
      <div className="h-32 w-32 rounded-full border-t-4 border-b-4 border-yellow-500 animate-spin"></div>
      <div
        className="absolute top-0 left-0 h-32 w-32 rounded-full border-t-4 border-b-4 border-yellow-300 animate-spin"
        style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
      ></div>
      <div className="absolute top-0 left-0 h-32 w-32 rounded-full border-t-4 border-b-4 border-yellow-100 animate-pulse"></div>
    </div>
    <div className="text-yellow-500 text-xl font-semibold animate-pulse">
      Cargando...
    </div>
  </div>
);

// Agregar función de validación de contraseña
const validatePassword = (password) => {
  const checks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;

  return {
    strength,
    checks,
    message:
      strength < 2
        ? "Muy débil"
        : strength < 3
        ? "Débil"
        : strength < 4
        ? "Media"
        : strength < 5
        ? "Fuerte"
        : "Muy fuerte",
    color:
      strength < 2
        ? "text-red-500"
        : strength < 3
        ? "text-orange-500"
        : strength < 4
        ? "text-yellow-500"
        : strength < 5
        ? "text-green-400"
        : "text-green-500",
  };
};

const Register = () => {
  // Estados agrupados
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    name: "",
  });

  const [uiState, setUiState] = useState({
    newUser: false,
    error: "",
    loading: false,
  });

  const [isLocked, setIsLocked] = useState(false);
  const [lockExpiration, setLockExpiration] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
  });

  const [passwordValidation, setPasswordValidation] = useState({
    strength: 0,
    checks: {},
    message: "",
    color: "",
  });

  const [emailValidation, setEmailValidation] = useState({
    isValid: true,
    isAvailable: true,
    message: "",
    color: "",
  });

  const navigate = useNavigate();

  // Redirige según el rol del usuario
  const handleRedirect = useCallback(
    (role) => {
      switch (role) {
        case "admin":
          navigate("/admin");
          break;
        case "atm":
          navigate("/atm");
          break;
        //   case "superuser":
        //     navigate("/superuser");
        //     break;
        default:
          navigate("/student");
          break;
      }
    },
    [navigate]
  );

  // Maneja el registro de un nuevo usuario
  const handleRegister = useCallback(
    async (e) => {
      e.preventDefault();

      // Verificar validación de email
      if (!emailValidation.isValid || !emailValidation.isAvailable) {
        setUiState((prev) => ({
          ...prev,
          error: "Por favor use un correo electrónico válido y disponible",
        }));
        return;
      }

      setUiState((prevState) => ({ ...prevState, loading: true }));

      if (!formData.email || !formData.password || !formData.name) {
        setUiState((prevState) => ({
          ...prevState,
          error: "Por favor llene todos los campos",
          loading: false,
        }));
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setUiState((prevState) => ({
          ...prevState,
          error: "Contraseñas no concuerdan",
          loading: false,
        }));
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: formData.name,
          role: formData.role,
          memberSince: Timestamp.fromDate(new Date()), // Asigna la fecha actual de registro
        });

        // Redirigir según el rol
        handleRedirect(formData.role);
      } catch (err) {
        let errorMessage = "Error durante el registro";
        switch (err.code) {
          case "auth/email-already-in-use":
            errorMessage = "Este correo electrónico ya está registrado";
            break;
          case "auth/invalid-email":
            errorMessage = "El formato del correo electrónico no es válido";
            break;
          case "auth/operation-not-allowed":
            errorMessage = "La operación no está permitida";
            break;
          case "auth/weak-password":
            errorMessage = "La contraseña debe tener al menos 6 caracteres";
            break;
          default:
            errorMessage = "Ocurrió un error durante el registro";
            break;
        }
        setUiState((prev) => ({ ...prev, error: errorMessage }));
      } finally {
        setUiState((prevState) => ({ ...prevState, loading: false }));
      }
    },
    [formData, handleRedirect, emailValidation]
  );

  // Maneja el inicio de sesión
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setUiState((prev) => ({ ...prev, loading: true }));

      try {
        const canLogin = await checkLoginAttempts(formData.email);
        if (!canLogin) {
          const remainingTime = Math.ceil(
            (lockExpiration - new Date().getTime()) / 1000 / 60
          );
          setUiState((prev) => ({ ...prev, loading: false }));
          return;
        }

        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;

        // Obtener rol del usuario
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setTimeout(() => {
            handleRedirect(userData.role);
          }, 30);
        } else {
          setUiState((prevState) => ({
            ...prevState,
            error: "Datos de Usuario no encontrados",
          }));
        }
        await updateLoginAttempts(formData.email, true);
      } catch (err) {
        let errorMessage;
        switch (err.code) {
          case "auth/user-not-found":
            errorMessage = "Usuario no encontrado";
            break;
          case "auth/wrong-password":
            errorMessage = "Contraseña incorrecta";
            break;
          case "auth/invalid-email":
            errorMessage = "Formato de correo electrónico inválido";
            break;
          case "auth/user-disabled":
            errorMessage = "Esta cuenta ha sido deshabilitada";
            break;
          default:
            errorMessage = "Error al iniciar sesión";
            break;
        }
        setUiState((prevState) => ({
          ...prevState,
          error: errorMessage,
          loading: false,
        }));
        await updateLoginAttempts(formData.email, false);
      }
    },
    [formData, handleRedirect, lockExpiration]
  );

  const checkLoginAttempts = async (email) => {
    try {
      const userRef = doc(db, "loginAttempts", email);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const { attempts, lockedUntil, lockCount = 0 } = userDoc.data();

        // Verificar si está bloqueado
        if (lockedUntil && new Date().getTime() < lockedUntil) {
          setIsLocked(true);
          setLockExpiration(lockedUntil);
          return false;
        }

        // Reiniciar bloqueo si ya expiró
        if (lockedUntil && new Date().getTime() >= lockedUntil) {
          await setDoc(userRef, {
            attempts: 0,
            lockedUntil: null,
            lockCount: lockCount, // Mantener el contador de bloqueos
          });
          setIsLocked(false);
          setLockExpiration(null);
        }
      } else {
        // Crear registro inicial
        await setDoc(userRef, {
          attempts: 0,
          lockedUntil: null,
          lockCount: 0,
        });
      }
      return true;
    } catch (error) {
      console.error("Error checking login attempts:", error);
      return true;
    }
  };

  const updateLoginAttempts = async (email, success) => {
    try {
      const userRef = doc(db, "loginAttempts", email);
      const userDoc = await getDoc(userRef);
      const data = userDoc.exists()
        ? userDoc.data()
        : { attempts: 0, lockCount: 0 };

      if (success) {
        // Reiniciar intentos en caso de éxito
        await setDoc(userRef, {
          attempts: 0,
          lockedUntil: null,
          lockCount: 0, // Reiniciar contador de bloqueos en login exitoso
        });
        setIsLocked(false);
        setLockExpiration(null);
      } else {
        const newAttempts = data.attempts + 1;

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const newLockCount = (data.lockCount || 0) + 1;
          const multiplier = Math.min(newLockCount, MAX_LOCK_MULTIPLIER);
          const lockDuration = BASE_LOCK_DURATION * multiplier;
          const lockExpiration = new Date().getTime() + lockDuration;

          await setDoc(userRef, {
            attempts: newAttempts,
            lockedUntil: lockExpiration,
            lockCount: newLockCount,
          });

          setIsLocked(true);
          setLockExpiration(lockExpiration);

          const minutes = Math.ceil(lockDuration / 1000 / 60);
          toast.error("Cuenta bloqueada temporalmente", {
            description: `Demasiados intentos fallidos. Intente nuevamente en ${minutes} minutos.`,
          });
        } else {
          await setDoc(userRef, {
            ...data,
            attempts: newAttempts,
            lockedUntil: null,
          });
          toast.error(
            `Intento fallido ${newAttempts} de ${MAX_LOGIN_ATTEMPTS}`
          );
        }
      }
    } catch (error) {
      console.error("Error updating login attempts:", error);
    }
  };

  // Agregar efecto para actualizar el contador
  useEffect(() => {
    let intervalId;

    if (isLocked && lockExpiration) {
      intervalId = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.ceil((lockExpiration - new Date().getTime()) / 1000)
        );

        if (remaining <= 0) {
          setIsLocked(false);
          setLockExpiration(null);
          setRemainingTime(0);
        } else {
          setRemainingTime(remaining);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLocked, lockExpiration]);

  // Función auxiliar para formatear el tiempo
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Modificar el input de contraseña en el registro
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData((prev) => ({ ...prev, password: newPassword }));
    if (uiState.newUser) {
      setPasswordValidation(validatePassword(newPassword));
    }
  };

  // Agregar función para verificar email
  const validateEmail = async (email) => {
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);

    if (!isValidFormat) {
      setEmailValidation({
        isValid: false,
        isAvailable: true,
        message: "Formato de correo inválido",
        color: "text-red-500",
      });
      return;
    }

    try {
      // Buscar si el email ya existe
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      const isAvailable = querySnapshot.empty;

      setEmailValidation({
        isValid: true,
        isAvailable,
        message: isAvailable
          ? "Correo disponible"
          : "Este correo ya está registrado",
        color: isAvailable ? "text-green-500" : "text-red-500",
      });
    } catch (error) {
      console.error("Error validando email:", error);
    }
  };

  // Modificar el manejador del cambio de email
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setFormData((prev) => ({ ...prev, email: newEmail }));
    if (uiState.newUser && newEmail) {
      validateEmail(newEmail);
    }
  };

  // Agregar funciones de autenticación social
  const handleGoogleSignIn = async () => {
    try {
      setUiState((prev) => ({ ...prev, loading: true }));
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account", // Forzar selección de cuenta
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verificar si el usuario ya existe
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        // Crear nuevo usuario en Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName || "Usuario de Google",
          role: "student",
          memberSince: Timestamp.fromDate(new Date()),
          photoURL: user.photoURL || null,
          provider: "google",
        });

        toast.success("Cuenta creada exitosamente");
      } else {
        // Actualizar última sesión
        await updateDoc(doc(db, "users", user.uid), {
          lastLogin: Timestamp.fromDate(new Date()),
        });
      }

      const userData = userDoc.exists() ? userDoc.data() : { role: "student" };
      handleRedirect(userData.role);
    } catch (error) {
      console.error("Error con Google Sign In:", error);
      let errorMessage = "Error al iniciar sesión con Google";

      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Ventana de inicio de sesión cerrada";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "Solicitud cancelada";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Ventana bloqueada por el navegador";
      }

      toast.error(errorMessage);
      setUiState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    } finally {
      setUiState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setUiState((prev) => ({ ...prev, loading: true }));
      const provider = new GithubAuthProvider();
      provider.addScope("user");

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verificar si el usuario ya existe
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        // Crear nuevo usuario en Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName || "Usuario de GitHub",
          role: "student",
          memberSince: Timestamp.fromDate(new Date()),
          photoURL: user.photoURL || null,
          provider: "github",
          githubUsername: result.additionalUserInfo?.username || null,
        });

        // Redirigir al nuevo usuario inmediatamente
        handleRedirect("student");
        toast.success("Cuenta creada exitosamente");
      } else {
        // Usuario existente - actualizar última sesión y redirigir
        await updateDoc(doc(db, "users", user.uid), {
          lastLogin: Timestamp.fromDate(new Date()),
        });
        const userData = userDoc.data();
        handleRedirect(userData.role);
      }
    } catch (error) {
      console.error("Error con GitHub Sign In:", error);
      let errorMessage = "Error al iniciar sesión con GitHub";

      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Ventana de inicio de sesión cerrada";
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        errorMessage =
          "Ya existe una cuenta con este email usando otro método de inicio de sesión";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Ventana bloqueada por el navegador";
      }

      toast.error(errorMessage);
      setUiState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    } finally {
      setUiState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      <div className="text-white">
        <div className="flex min-h-screen">
          <div className="flex w-1/2 items-end p-12">
            <div className="space-y-4">
              <blockquote className="  backdrop:blur-sm bg-[#5d6770] bg-opacity-30 rounded-lg indent-8 text-[#f5f5f5] font-serif text-3xl font-medium leading-tight">
                "El sitio web de esta biblioteca ha revolucionado la forma en
                que accedo a la información, ahorrándome innumerables horas de
                investigación y ayudándome a encontrar los recursos que necesito
                más rápido que nunca."
              </blockquote>
              <cite className="text-sm text-gray-400">Jane Doe</cite>
            </div>
          </div>

          <div className="flex rounded-md  bg-opacity-50 p-8 shadow-black shadow-lg backdrop:blur-sm bg-[#000000] w-1/2 items-center justify-center">
            {uiState.loading ? (
              <LoadingSpinner />
            ) : (
              <div className="w-full max-w-md space-y-8 px-4">
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold">
                    Sistema de Gestión Bibliotecaria
                  </h1>
                  <p className="text-sm text-gray-400">
                    Universidad de las Ciencias Informáticas
                  </p>
                </div>

                <form
                  onSubmit={uiState.newUser ? handleRegister : handleLogin}
                  className="grid gap-3 space-y-4"
                >
                  {uiState.newUser && (
                    <div className="relative text-2xl focus:outline-none focus:ring-0">
                      <Input
                        type="text"
                        id="name"
                        className=" w-full  py-2.3 px-0 text-2xl text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-yellow-500 focus:outline-none focus:ring-0  focus:text-white focus:border-yellow-600 peer"
                        placeholder=""
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prevState) => ({
                            ...prevState,
                            name: e.target.value,
                          }))
                        }
                      />
                      <label
                        htmlFor="name"
                        className="absolute text-gray-400 duration-300 transform  translate-y-[-58px] scale-75   origin-[0] peer-focus:translate-y-[-58px] peer-focus:text-yellow-600 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-[-32px] peer-focus:scale-75 font-sans antialiased font-semibold text-xl  "
                      >
                        Nombre
                      </label>
                      <BiUser className="absolute text-white right-[5px] top-[5px] transform   text-2xl" />
                    </div>
                  )}
                  <div className="relative text-2xl focus:outline-none focus:ring-0">
                    <Input
                      type="email"
                      id="email"
                      className=" w-full  py-2.3 px-0 text-2xl text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-yellow-500 focus:outline-none focus:ring-0  focus:text-white focus:border-yellow-600 peer"
                      placeholder=""
                      required
                      value={formData.email}
                      onChange={handleEmailChange}
                    />
                    <label
                      htmlFor="email"
                      className="absolute text-gray-400 duration-300 transform  translate-y-[-58px] scale-75   origin-[0] peer-focus:translate-y-[-58px] peer-focus:text-yellow-600 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-[-32px] peer-focus:scale-75 font-sans antialiased font-semibold text-xl  "
                    >
                      Correo
                    </label>
                    <BiUser className="absolute text-white right-[5px] top-[5px] transform   text-2xl" />
                    {uiState.newUser && formData.email && (
                      <div className="mt-2">
                        <p
                          className={` text-xl text-justify  font-semibold  rounded-md ${emailValidation.color}`}
                        >
                          {emailValidation.message}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="relative ">
                    <Input
                      type={showPasswords.password ? "text" : "password"}
                      id="password"
                      className=" w-full  py-2.3 px-0 text-xl text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-yellow-500 focus:outline-none focus:ring-0  focus:text-white focus:border-yellow-600 peer"
                      placeholder=""
                      required
                      value={formData.password}
                      onChange={handlePasswordChange}
                    />
                    <label
                      htmlFor="password"
                      className="absolute focus:outline-none text-gray-400 duration-300 transform  translate-y-[-58px] scale-75   origin-[0] peer-focus:translate-y-[-58px] peer-focus:text-yellow-600 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-[-32px] peer-focus:scale-75 font-sans antialiased font-semibold text-xl  "
                    >
                      Contraseña
                    </label>
                    <div className="absolute right-[5px] top-[5px] flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            password: !prev.password,
                          }))
                        }
                        className="text-white hover:text-yellow-500 transition-colors"
                      >
                        {showPasswords.password ? (
                          <AiOutlineEyeInvisible className="text-2xl" />
                        ) : (
                          <AiOutlineEye className="text-2xl" />
                        )}
                      </button>
                      <AiOutlineUnlock className="text-white text-2xl" />
                    </div>
                    {uiState.newUser && formData.password && (
                      <div className="mt-2">
                        <p className={`text-sm ${passwordValidation.color}`}>
                          Fortaleza: {passwordValidation.message}
                        </p>
                        <div className="text-xs space-y-1 mt-1 text-gray-300">
                          {!passwordValidation.checks.length && (
                            <p>• Mínimo 8 caracteres</p>
                          )}
                          {!passwordValidation.checks.hasUpper && (
                            <p>• Al menos una mayúscula</p>
                          )}
                          {!passwordValidation.checks.hasLower && (
                            <p>• Al menos una minúscula</p>
                          )}
                          {!passwordValidation.checks.hasNumber && (
                            <p>• Al menos un número</p>
                          )}
                          {!passwordValidation.checks.hasSpecial && (
                            <p>• Al menos un carácter especial</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {uiState.newUser && (
                    <div className="relative ">
                      <Input
                        type={
                          showPasswords.confirmPassword ? "text" : "password"
                        }
                        id="confirmPassword"
                        className=" w-full  py-2.3 px-0 text-xl text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-yellow-500 focus:outline-none focus:ring-0  focus:text-white focus:border-yellow-600 peer"
                        placeholder=""
                        required
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData((prevState) => ({
                            ...prevState,
                            confirmPassword: e.target.value,
                          }))
                        }
                      />
                      <label
                        htmlFor="confirmpassword"
                        className="absolute focus:outline-none text-gray-400 duration-300 transform  translate-y-[-58px] scale-75   origin-[0] peer-focus:translate-y-[-58px] peer-focus:text-yellow-600 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-[-32px] peer-focus:scale-75 font-sans antialiased font-semibold text-xl  "
                      >
                        Confirma Contraseña
                      </label>
                      <div className="absolute right-[5px] top-[5px] flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              confirmPassword: !prev.confirmPassword,
                            }))
                          }
                          className="text-white hover:text-yellow-500 transition-colors"
                        >
                          {showPasswords.confirmPassword ? (
                            <AiOutlineEyeInvisible className="text-2xl" />
                          ) : (
                            <AiOutlineEye className="text-2xl" />
                          )}
                        </button>
                        <AiOutlineUnlock className="text-white text-2xl" />
                      </div>
                    </div>
                  )}
                  {uiState.newUser ? (
                    <Button
                      type="submit"
                      className="w-full shadow-sm  shadow-black hover:border-2 hover:border-white bg-white font-semibold text-black hover:bg-[#5d6770] hover:bg-opacity-50 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="h-5 w-5" />
                      Registrarse
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="w-full shadow-sm  shadow-black hover:border-2 hover:border-white bg-white font-semibold text-black hover:bg-[#5d6770] hover:bg-opacity-50 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                      <LogIn className="h-5 w-5" />
                      Inicia Sesión
                    </Button>
                  )}

                  {/* Botones de autenticación social */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-black rounded-md px-2 text-zinc-400">
                        o usar otro método
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Button
                      onClick={handleGoogleSignIn}
                      type="button"
                      variant="outline"
                      className="w-full shadow-sm shadow-black bg-black font-semibold text-white hover:bg-white hover:bg-opacity-50 hover:text-black transition-colors duration-300"
                    >
                      <img
                        src="https://www.google.com/favicon.ico"
                        className="mr-2 h-4 w-4"
                        alt="Google"
                      />
                      Continuar con Google
                    </Button>

                    <Button
                      onClick={handleGithubSignIn}
                      type="button"
                      variant="outline"
                      className="w-full shadow-sm shadow-black bg-black font-semibold text-white hover:bg-white hover:bg-opacity-50 hover:text-black transition-colors duration-300"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      Continuar con GitHub
                    </Button>
                  </div>

                  <div className="  mx-5">
                    <div className=" text-center rounded-md  border-0 border-b-2 border-white px-4     text-zinc-400 mx-5">
                      {uiState.newUser ? (
                        <>
                          <Label className="text-white  mr-3 text-center ">
                            Ya tienes cuenta?
                          </Label>
                          <Label
                            onClick={() => {
                              setUiState((prevState) => ({
                                ...prevState,
                                newUser: false,
                                error: false,
                              }));
                            }}
                            className="text-yellow-500 hover:underline  text-center font-bold "
                          >
                            Inicia Sesión!
                          </Label>
                        </>
                      ) : (
                        <>
                          <span className="text-white  mr-3 text-center ">
                            No tienes cuenta?
                          </span>
                          <span
                            onClick={() => {
                              setUiState((prevState) => ({
                                ...prevState,
                                newUser: true,
                                error: false,
                              }));
                            }}
                            className="text-yellow-500 hover:underline text-center font-bold  "
                          >
                            Regístrate!
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </form>

                {uiState.error && (
                  <p className="bg-red-800 text-white text-center p-1 uppercase font-bold mt-3 mb-1 rounded-md">
                    {uiState.error}
                  </p>
                )}
                {isLocked && (
                  <div className="bg-red-800 text-white text-center p-1 uppercase font-bold mt-3 mb-1 rounded-md">
                    Cuenta bloqueada temporalmente. Intente nuevamente en{" "}
                    <span className="font-bold">
                      {formatTime(remainingTime)}
                    </span>{" "}
                    minutos.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
