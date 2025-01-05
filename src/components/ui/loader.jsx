const Loader = () => {
  return (
    <div className="relative">
      <div className="w-[200px] h-[200px] perspective-[200px]">
        <div className="absolute top-1/2 left-1/2 w-[120px] h-[120px] -mt-[60px] -ml-[60px] rounded-full border-[40px] border-[#1e3f57] origin-center transform rotate-x-24 rotate-y-20 -translate-z-[25px] animate-dot1" />
        <div className="absolute top-1/2 left-1/2 w-[140px] h-[140px] -mt-[70px] -ml-[70px] rounded-full border-[30px] border-[#447891] origin-center transform rotate-x-24 rotate-y-20 -translate-z-[25px] shadow-inner animate-dot2" />
        <div className="absolute top-1/2 left-1/2 w-[160px] h-[160px] -mt-[80px] -ml-[80px] rounded-full border-[20px] border-[#6bb2cd] origin-center transform rotate-x-24 rotate-y-20 -translate-z-[25px] shadow-inner animate-dot3" />
      </div>
    </div>
  );
};

export default Loader;
