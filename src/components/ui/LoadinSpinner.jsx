import { FaBook } from "react-icons/fa";

const LoadinSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-[200px] h-[200px] perspective-[200px]">
          {/* Círculos principales */}
          <div className="absolute top-1/2 left-1/2 w-[120px] h-[120px] -mt-[60px] -ml-[60px] rounded-full border-[40px] border-yellow-600 origin-center transform rotate-x-24 rotate-y-20 -translate-z-[25px] animate-dot1" />
          <div className="absolute top-1/2 left-1/2 w-[140px] h-[140px] -mt-[70px] -ml-[70px] rounded-full border-[30px] border-yellow-400 origin-center transform rotate-x-24 rotate-y-20 -translate-z-[25px] shadow-inner animate-dot2" />
          <div className="absolute top-1/2 left-1/2 w-[160px] h-[160px] -mt-[80px] -ml-[80px] rounded-full border-[20px] border-yellow-200 origin-center transform rotate-x-24 rotate-y-20 -translate-z-[25px] shadow-inner animate-dot3" />

          {/* Libros orbitando - ajustados para estar sobre la espiral */}
          <div className="absolute top-1/2 left-1/2 -mt-[60px] -ml-[60px] w-[120px] h-[120px]">
            <div className="animate-orbit1">
              <FaBook className="text-3xl text-yellow-600 absolute -mt-2 -ml-2" />
            </div>
            <div className="animate-orbit2">
              <FaBook className="text-3xl text-yellow-400 absolute -mt-2 -ml-2" />
            </div>
            <div className="animate-orbit3">
              <FaBook className="text-3xl text-yellow-200 absolute -mt-2 -ml-2" />
            </div>
            <div className="animate-orbit4">
              <FaBook className="text-3xl text-white absolute -mt-2 -ml-2" />
            </div>
          </div>
        </div>
      </div>
      <div className="text-white text-lg sm:text-xl font-serif tracking-wide animate-pulse select-none">
        Cargando...
      </div>
    </div>
  );
};

export default LoadinSpinner;
