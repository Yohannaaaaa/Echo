export default function EchoMark({ size = 112 }: { size?: number }) {
  const core = size * 0.45;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="absolute inline-flex h-full w-full animate-ripple rounded-full border border-echo-500/60" />
      <span
        className="absolute inline-flex h-full w-full animate-ripple rounded-full border border-glow-400/50"
        style={{ animationDelay: '0.73s' }}
      />
      <span
        className="absolute inline-flex h-full w-full animate-ripple rounded-full border border-echo-500/40"
        style={{ animationDelay: '1.47s' }}
      />
      <div
        className="relative rounded-full bg-gradient-to-br from-echo-500 to-glow-400 shadow-lg shadow-echo-500/30"
        style={{ width: core, height: core }}
      />
    </div>
  );
}
