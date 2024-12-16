import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

export function LoadingScreen() {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(66);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-black/80">
      <div className="w-11/12 sm:w-3/4 md:w-60 max-w-md space-y-4">
        <h2 className="text-center text-xl sm:text-2xl font-semibold mb-4">
          Cargando...
        </h2>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}
