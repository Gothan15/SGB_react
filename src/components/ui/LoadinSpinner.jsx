const LoadinSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-t-4 border-b-4 border-yellow-500 animate-spin"></div>
        <div
          className="absolute top-0 left-0 h-24 w-24 sm:h-32 sm:w-32 rounded-full border-t-4 border-b-4 border-yellow-300 animate-spin"
          style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
        ></div>
        <div className="absolute top-0 left-0 h-24 w-24 sm:h-32 sm:w-32 rounded-full border-t-4 border-b-4 border-yellow-100 animate-pulse"></div>
      </div>
      <div className="text-yellow-500 text-lg sm:text-xl font-semibold animate-pulse">
        Cargando...
      </div>
    </div>
  );
};
export default LoadinSpinner;
