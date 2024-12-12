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
      className="text-white min-h-[100vh] flex justify-center items-center bg-center bg-cover"
      style={{ backgroundImage: "url('/img/bg.jpeg')" }}
    >
      <Toaster richColors closeButton position="bottom-right" />
      <SidebarProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />

              {/* Rutas protegidas */}
              {Object.entries(routes).map(([role, tabs]) => (
                <Route
                  key={role}
                  path={`/${role}/*`}
                  element={
                    <PrivateRoute userRole={userRole} requiredRole={role}>
                      <Suspense fallback={<PageLoader />}>
                        {role === "admin" && <AdminPage />}
                        {role === "atm" && <BibPage />}
                        {role === "student" && <UserDashboard />}
                      </Suspense>
                    </PrivateRoute>
                  }
                >
                  <Route
                    index
                    element={<Navigate to={defaultRoutes[role]} replace />}
                  />
                  {Object.entries(tabs).map(([name, Component]) => (
                    <Route
                      key={name}
                      path={name.toLowerCase()}
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Component />
                        </Suspense>
                      }
                    />
                  ))}
                </Route>
              ))}
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SidebarProvider>
    </div>
  );
}

export default memo(App);
