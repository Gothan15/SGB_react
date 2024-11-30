//* eslint-disable no-unused-vars */
import ATMPage from "./components/ATMPage";
import AdminPage from "./components/AdminPage";
import Register from "./components/Register";
import UserDashboard from "./components/user-dashboard";
import Home from "./components/Home";
import AvailableBooks from "./components/tabs/AvailableBooks";
import BorrowedBooks from "./components/tabs/BorrowedBooks";
import ReservationHistory from "./components/tabs/ReservationHistory";
import AccountInfo from "./components/tabs/AccountInfo";
import ReservationsTab from "./components/tabs/ReservationsTab";
import UsersTab from "./components/tabs/UsersTab";
import BooksTab from "./components/tabs/BooksTab";
import ReportsTab from "./components/tabs/ReportsTab";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, memo } from "react";
import PrivateRoute from "./components/PrivateRoute";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { LoadingScreen } from "./components/LoadingScreen";
import { Navigate } from "react-router-dom";
import { Toaster } from "sonner";

function App() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true); // Estado de carga agregado

  // Obtiene el rol del usuario autenticado
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
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
      className="text-white min-h-[100vh] flex justify-center items-center bg-center bg-cover  "
      style={{ backgroundImage: "url('/img/bg.jpeg')" }}
    >
      <Toaster richColors closeButton position="bottom-right" />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/atm" element={<ATMPage />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute userRole={userRole} requiredRole="admin">
                <AdminPage />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="reservations" />} />
            <Route path="reservations" element={<ReservationsTab />} />
            <Route path="users" element={<UsersTab />} />
            <Route path="books" element={<BooksTab />} />
            <Route path="reports" element={<ReportsTab />} />
          </Route>
          <Route
            path="/student"
            element={
              <PrivateRoute userRole={userRole} requiredRole="student">
                <UserDashboard />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="borrowed" />} />
            <Route path="available" element={<AvailableBooks />} />
            <Route path="borrowed" element={<BorrowedBooks />} />
            <Route path="reservations" element={<ReservationHistory />} />
            <Route path="account" element={<AccountInfo />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default memo(App);
