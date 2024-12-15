/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import { lazy } from "react";
import { Navigate } from "react-router-dom";

// Páginas principales con code splitting
const Home = lazy(() => import("@/components/Home"));
const Register = lazy(() => import("@/components/Register"));

// Dashboards
const AdminDashboard = lazy(() => import("@/components/Admin-dashboard"));
const BibDashboard = lazy(() => import("@/components/Bibliotecario-dashboard"));
const UserDashboard = lazy(() => import("@/components/User-dashboard"));

// Admin tabs
const adminTabs = {
  Users: lazy(() => import("@/components/tabs/UsersTab")),
  Reports: lazy(() => import("@/components/tabs/ReportsTab")),
  Support: lazy(() => import("@/components/tabs/SupportTab")),
  Account: lazy(() => import("@/components/tabs/AccountInfo")),
};

// Bibliotecario tabs
const bibTabs = {
  Reservations: lazy(() => import("@/components/tabs/ReservationsTab")),
  Books: lazy(() => import("@/components/tabs/BooksTab")),
  Account: lazy(() => import("@/components/tabs/AccountInfo")),
};

// Usuario tabs
const userTabs = {
  Available: lazy(() => import("@/components/tabs/AvailableBooks")),
  Borrowed: lazy(() => import("@/components/tabs/BorrowedBooks")),
  Reservations: lazy(() => import("@/components/tabs/ReservationHistory")),
  Account: lazy(() => import("@/components/tabs/AccountInfo")),
};

export const routes = {
  admin: adminTabs,
  atm: bibTabs,
  student: userTabs,
};

export const defaultRoutes = {
  admin: "/admin/users",
  atm: "/atm/reservations",
  student: "/student/borrowed",
};

// También podemos agregar una utilidad para obtener la ruta base según el rol
export const getBasePath = (role) => {
  switch (role) {
    case "admin":
      return "/admin";
    case "atm":
      return "/atm";
    case "student":
      return "/student";
    default:
      return "/";
  }
};
