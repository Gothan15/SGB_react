/* eslint-disable react/no-unescaped-entities */

const QuoteSection = () => {
  return (
    <>
      <blockquote className="  backdrop-blur bg-transparent bg-opacity-70 rounded-lg indent-8 text-[#f5f5f5] font-serif text-3xl font-medium leading-tight">
        "El sitio web de esta biblioteca ha revolucionado la forma en que accedo
        a la información, ahorrándome innumerables horas de investigación y
        ayudándome a encontrar los recursos que necesito más rápido que nunca."
      </blockquote>
      <cite className="text-sm text-gray-400">Jane Doe</cite>
    </>
  );
};

export default QuoteSection;
