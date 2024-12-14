export const MeetAgent: React.FC = () => {
  return (
    <div className="mb-12 flex flex-col items-center justify-center gap-10">
      <h1 className="text-8xl font-bold text-secondary text-center">
        Helpful VC
      </h1>
      <img
        src="/crazy_scientist.png"
        alt="Helpful VC"
        className="w-[400px] h-[400px] rounded-full shadow-md shadow-accent"
      />
      <div className="bg-white/10 p-6 rounded-xl flex gap-6 items-center max-w-2xl">
        <div className="flex-shrink-0">
          <img
            src="/telegram.png"
            alt="Telegram logo"
            className="w-44 h-44 rounded-xl"
          />
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold mb-2 text-secondary">
            Contact the helpful VC, he will find the right mentor for your query
          </h3>
          <p className="text-slate-200">
            The agent will connect you with the best mentor in their network to
            help you with your problem or query. Mentors are ranked on their
            social tokens. More tokens means more proven success helping
            founders.
          </p>
        </div>
      </div>
    </div>
  );
};
