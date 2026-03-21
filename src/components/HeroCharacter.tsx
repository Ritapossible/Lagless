import gmumCharacter from "@/assets/gmum-character.jpg";

const HeroCharacter = () => {
  return (
    <div className="relative animate-float">
      {/* Glow backdrop */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl scale-75" />
      <img
        src={gmumCharacter}
        alt="GMUM Character"
        className="relative w-56 h-56 sm:w-64 sm:h-64 object-contain drop-shadow-[0_0_30px_hsl(200,100%,50%,0.4)]"
      />
    </div>
  );
};

export default HeroCharacter;
