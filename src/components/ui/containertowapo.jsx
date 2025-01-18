const Card = () => {
  return (
    <div className="w-72 h-48 perspective-1000">
      <div className="w-full h-full relative transform-style-preserve-3d transition-transform duration-1000 hover:rotate-y-180">
        <div className="absolute w-full h-full backface-hidden bg-purple-800 text-white flex items-center justify-center border-10 border-purple-800 rounded-lg text-2xl">
          <p>Front Side</p>
        </div>
        <div className="absolute w-full h-full backface-hidden bg-orange-500 text-white flex items-center justify-center border-10 border-orange-500 rounded-lg text-2xl rotate-y-180">
          <p>Back Side</p>
        </div>
      </div>
    </div>
  );
};

export default Card;
