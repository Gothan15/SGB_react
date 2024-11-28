/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useState, useCallback } from "react";
import { RiArrowRightDoubleFill } from "react-icons/ri";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { BiUser } from "react-icons/bi";
import { AiOutlineUnlock } from "react-icons/ai";
import { Github } from "lucide-react";
import { Link } from "react-router-dom";
//import icon from "../img/icon.jpeg";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
    [formData, handleRedirect]
  );

  // Maneja el inicio de sesión
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      // const token = generateToken(16);
      // localStorage.setItem("authToken", token);
      setUiState((prevState) => ({
        ...prevState,
        loading: true,
        role: "student",
      }));

      try {
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
      }
    },
    [formData, handleRedirect]
  );

  return (
    <div className="   text-white">
      {/* <nav className="bg-black flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <div className="text-xl font-semibold">Acme Inc</div>
        </div>

        <Button variant="ghost" className="text-white hover:text-white/80">
          Login
        </Button>
      </nav> */}

      <div className="flex min-h-screen">
        <div className="flex w-1/2 items-end p-12">
          <div className="space-y-4">
            <blockquote className="  backdrop:blur-sm bg-[#5d6770] bg-opacity-30 rounded-lg indent-8 text-[#f5f5f5] font-serif text-3xl font-medium leading-tight">
              "El sitio web de esta biblioteca ha revolucionado la forma en que
              accedo a la información, ahorrándome innumerables horas de
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
                <h1 className="text-3xl font-bold">Biblioteca.UCI</h1>
              </div>

              <div className="grid gap-3 space-y-4">
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
                    onChange={(e) =>
                      setFormData((prevState) => ({
                        ...prevState,
                        email: e.target.value,
                      }))
                    }
                  />
                  <label
                    htmlFor="email"
                    className="absolute text-gray-400 duration-300 transform  translate-y-[-58px] scale-75   origin-[0] peer-focus:translate-y-[-58px] peer-focus:text-yellow-600 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-[-32px] peer-focus:scale-75 font-sans antialiased font-semibold text-xl  "
                  >
                    Correo
                  </label>
                  <BiUser className="absolute text-white right-[5px] top-[5px] transform   text-2xl" />
                </div>
                <div className="relative ">
                  <Input
                    type="password"
                    id="password"
                    className=" w-full  py-2.3 px-0 text-xl text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-yellow-500 focus:outline-none focus:ring-0  focus:text-white focus:border-yellow-600 peer"
                    placeholder=""
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prevState) => ({
                        ...prevState,
                        password: e.target.value,
                      }))
                    }
                  />
                  <label
                    htmlFor="password"
                    className="absolute focus:outline-none text-gray-400 duration-300 transform  translate-y-[-58px] scale-75   origin-[0] peer-focus:translate-y-[-58px] peer-focus:text-yellow-600 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-[-32px] peer-focus:scale-75 font-sans antialiased font-semibold text-xl  "
                  >
                    Contraseña
                  </label>
                  <AiOutlineUnlock className="absolute text-white right-[5px] top-[5px] transform   text-2xl" />
                </div>

                {uiState.newUser && (
                  <div className="relative ">
                    <Input
                      type="password"
                      id="password"
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
                    <AiOutlineUnlock className="absolute text-white right-[5px] top-[5px] transform   text-2xl" />
                  </div>
                )}
                {uiState.newUser ? (
                  <Button
                    type="submit"
                    onClick={handleRegister}
                    className="w-full shadow-sm  shadow-black hover:border-2 hover:border-white bg-white font-semibold text-black hover:bg-[#5d6770] hover:bg-opacity-50 hover:text-white transition-colors duration-300 "
                  >
                    Registrarse
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      onClick={handleLogin}
                      className="w-full shadow-sm  shadow-black hover:border-2 hover:border-white bg-white font-semibold text-black hover:bg-[#5d6770] hover:bg-opacity-50 hover:text-white transition-colors duration-300"
                    >
                      Inicia Sesión
                    </Button>
                    {/* <RiArrowRightDoubleFill /> */}
                  </>
                )}

                {uiState.newUser && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-black rounded-md px-2 text-zinc-400">
                          o continúa con
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full shadow-sm  shadow-black   bg-black font-semibold text-white hover:bg-white hover:bg-opacity-50 hover:text-black transition-colors duration-300"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </Button>

                    <p className="text-center text-sm text-gray-200">
                      Al hacer click en continuar, usted acepta nuestros{" "}
                      <Link
                        href="#"
                        className="underline underline-offset-4 hover:text-white"
                      >
                        Terminos de Servicio
                      </Link>{" "}
                      y{" "}
                      <Link
                        href="#"
                        className="underline underline-offset-4 hover:text-white"
                      >
                        Politica Privada
                      </Link>
                      .
                    </p>
                  </>
                )}

                <div className="  mx-5">
                  <div className=" absolute rounded-md  border-0 border-b-2 border-white px-4 right-[345px]    text-zinc-400 mx-5">
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
              </div>
              {uiState.error && (
                <p className="bg-red-800  text-white text-center p-1 uppercase font-bold mt-3 mb-1 rounded-md">
                  {uiState.error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      {/* {loading && } */}
    </div>
  );
};

export default Register;
