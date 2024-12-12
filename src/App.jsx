// Importaciones de react , react-router-dom, firebase y sonner
import { lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, memo } from "react";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { SidebarProvider } from "./components/ui/sidebar";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import PrivateRoute from "./components/PrivateRoute";
import SuspenseWrapper from "./components/ui/SuspenseWrapper";

// Importaciones dinámicas
const Home = lazy(() => import("./components/Home"));
const Register = lazy(() => import("./components/Register"));
const BibPage = lazy(() => import("./components/Bibliotecario-dashboard"));
const AdminPage = lazy(() => import("./components/Admin-dashboard"));
const UserDashboard = lazy(() => import("./components/User-dashboard"));

// Importaciones dinámicas de tabs
const AvailableBooks = lazy(() => import("./components/tabs/AvailableBooks"));
const BorrowedBooks = lazy(() => import("./components/tabs/BorrowedBooks"));
const ReservationHistory = lazy(() =>
  import("./components/tabs/ReservationHistory")
);
const AccountInfo = lazy(() => import("./components/tabs/AccountInfo"));
const ReservationsTab = lazy(() => import("./components/tabs/ReservationsTab"));
const UsersTab = lazy(() => import("./components/tabs/UsersTab"));
const BooksTab = lazy(() => import("./components/tabs/BooksTab"));
const ReportsTab = lazy(() => import("./components/tabs/ReportsTab"));
const SupportTab = lazy(() => import("./components/tabs/SupportTab"));

function App() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true); // Estado de carga agregado

  // Obtiene el rol del usuario autenticado
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Forzamos la actualización del token para obtener las custom claims
        await user.getIdToken(true);

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
          console.log("Rol del usuario autenticado:", userDoc.data().role); // Console log agregado
        } else {
          setUserRole(null);
          console.log("No se encontró el documento del usuario autenticado."); // Console log agregado
        }
      } else {
        setUserRole(null);
        console.log("No hay usuario autenticado actualmente."); // Console log agregado
      }
      setLoading(false); // Cambiamos loading a false una vez determinado el estado
    });
    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    console.log("Cargando pantalla de carga..."); // Console log agregado
    return <LoadingScreen />;
  }

  return (
    <div
      className="text-white min-h-[100vh] flex justify-center items-center bg-center bg-cover"
      style={{ backgroundImage: "url('/img/bg.jpeg')" }}
    >
      <Toaster richColors closeButton position="bottom-right" />
      <SidebarProvider>
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <SuspenseWrapper>
                  <Home />
                </SuspenseWrapper>
              }
            />
            <Route
              path="/register"
              element={
                <SuspenseWrapper>
                  <Register />
                </SuspenseWrapper>
              }
            />
            <Route
              path="/atm"
              element={
                <PrivateRoute userRole={userRole} requiredRole="atm">
                  <SuspenseWrapper>
                    <BibPage />
                  </SuspenseWrapper>
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="reservations" />} />
              <Route
                path="reservations"
                element={
                  <SuspenseWrapper>
                    <ReservationsTab />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="books"
                element={
                  <SuspenseWrapper>
                    <BooksTab />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="account"
                element={
                  <SuspenseWrapper>
                    <AccountInfo />
                  </SuspenseWrapper>
                }
              />
            </Route>

            <Route
              path="/admin"
              element={
                <PrivateRoute userRole={userRole} requiredRole="admin">
                  <SuspenseWrapper>
                    <AdminPage />
                  </SuspenseWrapper>
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="users" />} />
              <Route
                path="users"
                element={
                  <SuspenseWrapper>
                    <UsersTab />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="reports"
                element={
                  <SuspenseWrapper>
                    <ReportsTab />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="support"
                element={
                  <SuspenseWrapper>
                    <SupportTab />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="account"
                element={
                  <SuspenseWrapper>
                    <AccountInfo />
                  </SuspenseWrapper>
                }
              />
            </Route>

            <Route
              path="/student"
              element={
                <PrivateRoute userRole={userRole} requiredRole="student">
                  <SuspenseWrapper>
                    <UserDashboard />
                  </SuspenseWrapper>
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="borrowed" />} />
              <Route
                path="available"
                element={
                  <SuspenseWrapper>
                    <AvailableBooks />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="borrowed"
                element={
                  <SuspenseWrapper>
                    <BorrowedBooks />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="reservations"
                element={
                  <SuspenseWrapper>
                    <ReservationHistory />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="account"
                element={
                  <SuspenseWrapper>
                    <AccountInfo />
                  </SuspenseWrapper>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </div>
  );
}

export default memo(App);
