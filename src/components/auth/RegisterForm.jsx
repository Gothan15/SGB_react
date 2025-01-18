/* eslint-disable no-unused-vars */
// React y Hooks
import React, { useState, useCallback, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

// Firebase
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
  collection,
  query,
  getDocs,
  where,
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

// Iconos
import { BiUser } from "react-icons/bi";
import { Mail } from "lucide-react";
import { LogIn, UserPlus } from "lucide-react";

// Componentes UI
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import SocialLoginButtons from "./SocialLoginButtons";

// Importar hook personalizado y componente FormInput
import useForm from "@/hooks/useForm";
import FormInput from "./FormInput";
import validatePassword from "./validatePassword"; // Importar validatePassword
import { httpsCallable } from "firebase/functions";

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
  const initialFormData = React.useMemo(
    () => ({
      email: "",
      password: "",
      confirmPassword: "",
      role: "student",
      name: "",
    }),
    []
  );

  const { formData, handleSubmit, setFormData } = useForm(
    initialFormData,
    async (data, e) => {
      if (uiState.newUser) {
        await handleRegister(e);
      } else {
        await handleLogin(e);
      }
    }
  );

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

  const [passwordsMatch, setPasswordsMatch] = useState({
    match: true,
    message: "",
    color: "",
  });

  const navigate = useNavigate();

  // Redirige según el rol del usuario
  const handleRedirect = useCallback(
    (role) => {
      setUiState((prev) => ({ ...prev, loading: true }));
      setTimeout(() => {
        const routes = {
          admin: "/admin",
          atm: "/atm",
          student: "/student",
        };
        navigate(routes[role] || "/register", { replace: true });
      }, 100);
    },
    [navigate, setUiState]
  );

  // Agregar una función para reiniciar el formulario
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
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
  }, [initialFormData, setFormData]);

  // Maneja el registro de un nuevo usuario
  const handleRegister = useCallback(
    async (e) => {
      e.preventDefault();
      setUiState((prev) => ({ ...prev, loading: true }));

      try {
        console.log("Obteniendo token reCAPTCHA para registro...");
        const token = await window.grecaptcha.execute(
          "6LcpypkqAAAAANjqYhsE6expeptIsK1JH6ucYEwE",
          { action: "register" }
        );
        console.log("Estado del token:", token ? "Presente" : "Ausente");

        if (!token) {
          console.warn("Intento de registro sin token reCAPTCHA");
          toast.error("Por favor verifica que no eres un robot");
          return;
        }

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
    [formData, navigate, setUiState, resetForm]
  );

  // Maneja el inicio de sesión
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setUiState((prev) => ({ ...prev, loading: true }));

      // Obtener IP del usuario
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const { ip } = await ipResponse.json();

      // Verificar intentos de la IP
      const checkIpAttempts = httpsCallable(functions, "checkIpAttempts");
      const { data } = await checkIpAttempts({ ip });

      if (data.blocked) {
        navigate("/blocked");
        return;
      }

      const updateLoginAttempts = async (email, success) => {
        try {
          const userRef = doc(db, "loginAttempts", email);
          const userDoc = await getDoc(userRef);
          const data = userDoc.exists()
            ? userDoc.data()
            : { attempts: 0, lockCount: 0 };

          if (success) {
            await setDoc(userRef, {
              attempts: 0,
              lockedUntil: null,
              lockCount: 0,
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

      try {
        console.log("Obteniendo token reCAPTCHA para login...");
        const token = await window.grecaptcha.execute(
          "6LcpypkqAAAAANjqYhsE6expeptIsK1JH6ucYEwE",
          { action: "login" }
        );
        console.log("Estado del token:", token ? "Presente" : "Ausente");

        if (!token) {
          console.warn("Intento de login sin token reCAPTCHA");
          toast.error("Por favor verifica que no eres un robot");
          return;
        }

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
    [
      setUiState,
      formData.email,
      formData.password,
      navigate,
      resetForm,
      setIsLocked,
      setLockExpiration,
    ]
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
  // Agregar efecto para actualizar el contador
  useEffect(() => {
    if (!isLocked || !lockExpiration) return;

    const intervalId = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((lockExpiration - Date.now()) / 1000)
      );

      if (remaining <= 0) {
        setIsLocked(false);
        setLockExpiration(null);
        setRemainingTime(0);
        clearInterval(intervalId);
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [
    isLocked,
    lockExpiration,
    setIsLocked,
    setLockExpiration,
    setRemainingTime,
  ]);

  // Función auxiliar para formatear el tiempo
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  // Agregar función para verificar email con useCallback
  const validateEmail = useCallback(async (email) => {
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
  }, []);

  // Agregar debounce para la validación de email
  useEffect(() => {
    const handler = setTimeout(() => {
      if (uiState.newUser && formData.email) {
        validateEmail(formData.email);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [formData.email, uiState.newUser, validateEmail]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (name === "password") {
        const validation = validatePassword(value);
        setPasswordValidation(validation);
      }

      if (name === "password" || name === "confirmPassword") {
        const password = name === "password" ? value : formData.password;
        const confirmPassword =
          name === "confirmPassword" ? value : formData.confirmPassword;

        if (password && confirmPassword) {
          if (password === confirmPassword) {
            setPasswordsMatch({
              match: true,
              message: "Las contraseñas coinciden",
              color: "text-green-500",
            });
          } else {
            setPasswordsMatch({
              match: false,
              message: "Las contraseñas no coinciden",
              color: "text-red-500",
            });
          }
        } else {
          setPasswordsMatch({
            match: false,
            message: "Por favor confirma tu contraseña",
            color: "text-red-500",
          });
        }
      }
    },
    [formData.password, formData.confirmPassword, setFormData]
  );

  return (
    <div className="w-full max-w-md mx-auto space-y-6 px-2 md:px-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sistema de Gestión Bibliotecaria</h1>
        <p className="text-sm text-gray-400">
          Universidad de las Ciencias Informáticas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-2 md:gap-3 space-y-4">
        {uiState.newUser && (
          <FormInput
            type="text"
            id="name"
            name="name"
            label="Nombre"
            value={formData.name}
            onChange={handleChange}
            icon={BiUser}
          />
        )}

        <FormInput
          type="email"
          id="email"
          name="email"
          label="Correo"
          value={formData.email}
          onChange={handleChange}
          icon={Mail}
          validationMessage={
            uiState.newUser && formData.email ? emailValidation.message : ""
          }
          validationColor={emailValidation.color}
        />

        <FormInput
          type={showPasswords.password ? "text" : "password"}
          id="password"
          name="password"
          label="Contraseña"
          value={formData.password}
          onChange={handleChange}
          showPasswordToggle
          isPasswordVisible={showPasswords.password}
          togglePassword={() =>
            setShowPasswords((prev) => ({ ...prev, password: !prev.password }))
          }
          validationMessage={
            uiState.newUser &&
            formData.password && (
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
            )
          }
        />

        {uiState.newUser && (
          <FormInput
            type={showPasswords.confirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            label="Confirma Contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            showPasswordToggle
            isPasswordVisible={showPasswords.confirmPassword}
            togglePassword={() =>
              setShowPasswords((prev) => ({
                ...prev,
                confirmPassword: !prev.confirmPassword,
              }))
            }
            validationMessage={passwordsMatch.message}
            validationColor={passwordsMatch.color}
          />
        )}

        {/* Botones de autenticación social */}
        <SocialLoginButtons
          setUiState={setUiState}
          handleRedirect={handleRedirect}
        />

        {/* Botones de registro/inicio de sesión */}
        {uiState.newUser ? (
          <Button
            type="submit"
            className="w-full shadow-sm shadow-black hover:border-2 hover:border-white bg-white font-semibold text-black hover:bg-[#5d6770] hover:bg-opacity-50 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <UserPlus className="h-5 w-5" />
            Registrarse
          </Button>
        ) : (
          <Button
            type="submit"
            className="w-full shadow-sm shadow-black hover:border-2 hover:border-white bg-white font-semibold text-black hover:bg-[#5d6770] hover:bg-opacity-50 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Inicia Sesión
          </Button>
        )}

        {/* Enlaces de registro/inicio de sesión */}
        <div className="mx-5 text-center rounded-md border-b-2 border-white text-zinc-400">
          {uiState.newUser ? (
            <>
              <Label className="text-white mr-3">Ya tienes cuenta?</Label>
              <Label
                onClick={() =>
                  setUiState((prev) => ({ ...prev, newUser: false, error: "" }))
                }
                className="text-yellow-500 hover:underline font-bold cursor-pointer"
              >
                Inicia Sesión!
              </Label>
            </>
          ) : (
            <>
              <span className="text-white mr-3">No tienes cuenta?</span>
              <span
                onClick={() =>
                  setUiState((prev) => ({ ...prev, newUser: true, error: "" }))
                }
                className="text-yellow-500 hover:underline font-bold cursor-pointer"
              >
                Regístrate!
              </span>
            </>
          )}
        </div>

        {/* Enlace de recuperación de contraseña */}
        {!uiState.newUser && (
          <div className="text-center mt-4">
            <span
              onClick={() => navigate("/reset-password")}
              className="text-yellow-500 hover:underline rounded-md border-b-2 border-white font-bold cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </span>
          </div>
        )}
      </form>

      {/* Mensajes de error y bloqueo */}
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
        <Outlet context={{ setUiState, handleRedirect }} />
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

FormInput.propTypes = {
  type: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  icon: PropTypes.elementType,
  showPasswordToggle: PropTypes.bool,
  isPasswordVisible: PropTypes.bool,
  togglePassword: PropTypes.func,
  validationMessage: PropTypes.string,
  validationColor: PropTypes.string,
};

export default RegisterForm;
