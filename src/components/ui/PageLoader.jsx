import { Progress } from "@/components/ui/progress";

const PageLoader = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-[300px] space-y-4">
        <Progress value={33} className="animate-pulse" />
        <p className="text-sm text-white text-center animate-pulse">
          Cargando contenido...
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
