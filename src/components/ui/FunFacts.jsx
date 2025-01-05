import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";

const funFacts = [
  "El libro más vendido de todos los tiempos es la Biblia.",
  "El primer libro impreso con tipos móviles fue la Biblia de Gutenberg.",
  "El libro más caro jamás vendido fue el Codex Leicester de Leonardo da Vinci.",
  "La Biblioteca del Congreso de EE.UU. es la biblioteca más grande del mundo.",
  "El libro más pequeño del mundo mide solo 0.07 mm x 0.10 mm.",
  "La novela más larga jamás escrita es 'En busca del tiempo perdido' de Marcel Proust.",
  "El libro más antiguo conocido es una tablilla de arcilla sumeria de alrededor del 2400 a.C.",
  "La primera novela moderna es considerada 'Don Quijote' de Miguel de Cervantes.",
  "El libro más traducido del mundo es 'El Principito' de Antoine de Saint-Exupéry.",
  "La primera biblioteca pública en los Estados Unidos fue fundada en 1833 en Peterborough, New Hampshire.",
];

const FunFacts = () => {
  const [currentFact, setCurrentFact] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const changeFact = () => {
      setIsFlipped(true);
      // Esperamos a que la carta termine de girar para cambiar el texto
      setTimeout(() => {
        const randomFact =
          funFacts[Math.floor(Math.random() * funFacts.length)];
        setCurrentFact(randomFact);
        setIsFlipped(false);
      }, 500); // La mitad de la duración de la animación
    };

    changeFact();
    const intervalId = setInterval(changeFact, 10000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="h-[5vw] perspective-1000">
      <div
        className={`w-full h-full relative transform-style-preserve-3d transition-transform duration-1000 ease-in-out ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        <div className="absolute w-full h-full backface-hidden bg-white/10 text-white flex items-center p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-6 w-6 text-yellow-400 flex-shrink-0" />
            <span className="text-sm">{currentFact}</span>
          </div>
        </div>
        <div className="absolute w-full h-full backface-hidden bg-white/10 text-white flex items-center p-4 rounded-lg rotate-y-180">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-6 w-6 text-yellow-400 flex-shrink-0" />
            <span className="text-sm">Cambiando dato curioso...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunFacts;
