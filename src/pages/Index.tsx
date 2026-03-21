import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import HeroCharacter from "@/components/HeroCharacter";
import PlayButton from "@/components/PlayButton";
import spaceBg from "@/assets/space-bg.jpg";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <img
          src={spaceBg}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-space-dark/40" />
      </div>

      <TopBar />

      {/* Main content */}
      <main className="flex flex-col items-center justify-center min-h-screen px-6 pb-24 pt-20">
        {/* Character */}
        <div className="mb-6 opacity-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <HeroCharacter />
        </div>

        {/* Title */}
        <div className="mb-10 text-center opacity-0 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h1 className="font-display text-5xl sm:text-6xl font-black tracking-wider leading-[1.05] neon-glow">
            Latency
            <br />
            Escape
          </h1>
        </div>

        {/* Play button */}
        <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <PlayButton />
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
