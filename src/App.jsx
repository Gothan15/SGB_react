// Importaciones de react , react-router-dom, firebase y sonner
import { Suspense, lazy } from "react";
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
import { routes, defaultRoutes } from "./routes";
import PageLoader from "./components/ui/PageLoader";
import PasswordResetForm from "./components/auth/PasswordResetForm";

// Importaciones dinámicas
const Home = lazy(() => import("./components/Home"));
const Register = lazy(() => import("./components/Register"));
const BibPage = lazy(() => import("./components/Bibliotecario-dashboard"));
const AdminPage = lazy(() => import("./components/Admin-dashboard"));
const UserDashboard = lazy(() => import("./components/User-dashboard"));

function App() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!mounted) return;

        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && mounted) {
            setUserRole(userDoc.data().role);
          }
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error al verificar el usuario:", error);
        setUserRole(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div
      className="text-white min-h-screen flex flex-col md:flex-row justify-center items-center bg-center bg-cover "
      style={{ backgroundImage: "url('/img/bg.jpeg')" }}
    >
      <Toaster richColors closeButton position="bottom-right" />
      <SidebarProvider>
        <BrowserRouter
          future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<PasswordResetForm />} />

              {/* Rutas protegidas */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute userRole={userRole} requiredRole="admin">
                    <AdminPage />
                  </PrivateRoute>
                }
              >
                <Route
                  index
                  element={<Navigate to={defaultRoutes.admin} replace />}
                />
                {Object.entries(routes.admin).map(([name, Component]) => (
                  <Route
                    key={name}
                    path={name.toLowerCase()}
                    element={<Component />}
                  />
                ))}
              </Route>

              <Route
                path="/atm"
                element={
                  <PrivateRoute userRole={userRole} requiredRole="atm">
                    <BibPage />
                  </PrivateRoute>
                }
              >
                <Route
                  index
                  element={<Navigate to={defaultRoutes.atm} replace />}
                />
                {Object.entries(routes.atm).map(([name, Component]) => (
                  <Route
                    key={name}
                    path={name.toLowerCase()}
                    element={<Component />}
                  />
                ))}
              </Route>

              <Route
                path="/student"
                element={
                  <PrivateRoute userRole={userRole} requiredRole="student">
                    <UserDashboard />
                  </PrivateRoute>
                }
              >
                <Route
                  index
                  element={<Navigate to={defaultRoutes.student} replace />}
                />
                {Object.entries(routes.student).map(([name, Component]) => (
                  <Route
                    key={name}
                    path={name.toLowerCase()}
                    element={<Component />}
                  />
                ))}
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SidebarProvider>
    </div>
  );
}

export default memo(App);
