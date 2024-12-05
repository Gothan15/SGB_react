import { UserCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { auth } from "../firebaseConfig";
import { useState, useEffect } from "react";

export default function WelcomeUser() {
  const [userName, setUserName] = useState("");
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Si el usuario tiene displayName, úsalo, si no, usa el email
        setUserName(user.displayName || user.email?.split("@")[0] || "Usuario");
      }
    });

    // Manejar la barra de progreso y la visibilidad
    const timer = setTimeout(() => setShow(false), 5000);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => {
      unsubscribe();
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <Card className="w-auto bg-primary text-primary-foreground">
        <CardContent className="flex w-[auto] h-[65px] items-center space-x-4 p-6">
          <UserCircle className="h-12 w-12" />
          <div>
            <h2 className="text-xl font-bold">Bienvenido, {userName}</h2>
            <p className="text-primary-foreground/80">
              Es un placer tenerte de vuelta en nuestro sistema de biblioteca.
            </p>
          </div>
        </CardContent>
        <Progress value={progress} className="bg-white h-1" />
      </Card>
    </div>
  );
}

// Agrega esta animación a tu archivo global.css o tailwind.config.js
// @keyframes fadeIn {
//   from { opacity: 0; transform: translateY(-20px); }
//   to { opacity: 1; transform: translateY(0); }
// }
