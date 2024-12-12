/* eslint-disable no-unused-vars */
// React y Hooks
import React, { useState, useCallback, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

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
  PASSWORD_CONFIG,
  functions,
} from "@/firebaseConfig";
import { httpsCallable } from "firebase/functions";

// Iconos
import { RiArrowRightDoubleFill } from "react-icons/ri";
import { BiUser } from "react-icons/bi";
import {
  AiOutlineUnlock,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import { Github, Mail } from "lucide-react";
import { LogIn, UserPlus } from "lucide-react";

// Componentes UI
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import validatePassword from "./validatePassword";

import SocialLoginButtons from "./SocialLoginButtons";

const RegisterForm = ({
  uiState,
  setUiState,
  isLocked,
  setIsLocked,
  lockExpiration,
  setLockExpiration,
  remainingTime,
  setRemainingTime,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    name: "",
  });

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
      setUiState((prev) => ({ ...prev, loading: true }));
      // Pequeño delay para asegurar que los estados se actualicen
      setTimeout(() => {
        switch (role) {
          case "admin":
            navigate("/admin", { replace: true });
            break;
          case "atm":
            navigate("/atm", { replace: true });
            break;
          case "student":
            navigate("/student", { replace: true });
            break;
          default:
            navigate("/register", { replace: true });
        }
      }, 100);
    },
    [navigate]
  );

  // Agregar una función para reiniciar el formulario
  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      role: "student",
      name: "",
    });
    setPasswordValidation({
      strength: 0,
      checks: {},
      message: "",
      color: "",
    });
    setEmailValidation({
      isValid: true,
      isAvailable: true,
      message: "",
      color: "",
    });
  };

  // Maneja el registro de un nuevo usuario
  const handleRegister = useCallback(
    async (e) => {
      e.preventDefault();
      setUiState((prev) => ({ ...prev, loading: true }));

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          memberSince: Timestamp.fromDate(new Date()),
          passwordLastChanged: null,
          requiresPasswordChange: true,
          passwordExpiresAt: Timestamp.fromDate(
            new Date(
              Date.now() + PASSWORD_CONFIG.MAX_AGE_DAYS * 24 * 60 * 60 * 1000
            )
          ),
        });

        await setDoc(doc(db, "passwordHistory", userCredential.user.uid), {
          passwords: [
            {
              hash: formData.password,
              createdAt: Timestamp.fromDate(new Date()),
            },
          ],
        });

        navigate(`/${formData.role}`, { replace: true });
      } catch (err) {
        if (err.code === "auth/popup-closed-by-user") {
          resetForm();
          setUiState((prev) => ({
            ...prev,
            error: "",
            loading: false,
          }));
          return;
        }
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
        setUiState((prev) => ({ ...prev, loading: false }));
      }
    },
    [formData, navigate, setUiState]
  );

  // Maneja el inicio de sesión
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setUiState((prev) => ({ ...prev, loading: true }));

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

        if (userDoc.exists()) {
          const role = userDoc.data().role;
          navigate(`/${role}`, { replace: true });
        }
      } catch (err) {
        if (err.code === "auth/popup-closed-by-user") {
          resetForm();
          setUiState((prev) => ({
            ...prev,
            error: "",
            loading: false,
          }));
          return;
        }
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
      } finally {
        setUiState((prev) => ({ ...prev, loading: false }));
      }
    },
    [formData, navigate, setUiState]
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
  }, [
    isLocked,
    lockExpiration,
    setIsLocked,
    setLockExpiration,
    setRemainingTime,
  ]);

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

  return (
    <div className="w-full max-w-md space-y-8 px-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sistema de Gestión Bibliotecaria</h1>
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
          <Mail className="absolute text-white right-[5px] top-[5px] transform   text-2xl" />
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
              type={showPasswords.confirmPassword ? "text" : "password"}
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
        <SocialLoginButtons
          setUiState={setUiState}
          handleRedirect={handleRedirect}
        />

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
                      error: "", // Cambiar false por cadena vacía
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
                      error: "", // Cambiar false por cadena vacía
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
          <span className="font-bold">{formatTime(remainingTime)}</span>{" "}
          minutos.
        </div>
      )}
      <div className="p-4">
        <Outlet
          context={{
            setUiState,
            handleRedirect,
          }}
        />
      </div>
    </div>
  );
};

RegisterForm.propTypes = {
  uiState: PropTypes.shape({
    newUser: PropTypes.bool,
    error: PropTypes.string,
    // Otros campos si los hay
  }).isRequired,
  setUiState: PropTypes.func.isRequired,
  isLocked: PropTypes.bool.isRequired,
  setIsLocked: PropTypes.func.isRequired,
  lockExpiration: PropTypes.instanceOf(Date),
  setLockExpiration: PropTypes.func.isRequired,
  remainingTime: PropTypes.number,
  setRemainingTime: PropTypes.func.isRequired,
};

export default RegisterForm;
