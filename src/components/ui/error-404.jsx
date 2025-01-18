"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export default function Error404() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleReload = () => {
    setIsLoading(true);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-white via-gray-500 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto space-y-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-7xl sm:text-9xl font-extrabold text-white tracking-widest">
            404
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="px-4"
        >
          <p className="text-xl sm:text-2xl font-semibold text-white">
            Oops! Página no encontrada
          </p>
          <p className="mt-2 text-sm sm:text-base text-white">
            La página que estás buscando no existe o ha sido movida.
          </p>
        </motion.div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            <Home className="mr-2 h-5 w-5" />
            Volver al inicio
          </Link>
          <button
            onClick={handleReload}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            <RefreshCw
              className={`mr-2 h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Recargando..." : "Recargar página"}
          </button>
        </div>
      </div>
    </div>
  );
}
