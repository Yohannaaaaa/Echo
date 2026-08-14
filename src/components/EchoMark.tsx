export default function EchoMark({ size = 112, animated = true }: { size?: number; animated?: boolean }) {
  const core = size * 0.45;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <span
        className={`absolute inline-flex h-full w-full rounded-full border border-echo-500/60 ${
          animated ? 'animate-ripple' : 'opacity-30'
        }`}
      />
      <span
        className={`absolute inline-flex h-full w-full rounded-full border border-glow-400/50 ${
          animated ? 'animate-ripple' : 'opacity-0'
        }`}
        style={animated ? { animationDelay: '0.73s' } : undefined}
      />
      <span
        className={`absolute inline-flex h-full w-full rounded-full border border-echo-500/40 ${
          animated ? 'animate-ripple' : 'opacity-0'
        }`}
        style={animated ? { animationDelay: '1.47s' } : undefined}
      />
      <div
        className="relative rounded-full bg-gradient-to-br from-echo-500 to-glow-400 shadow-lg shadow-echo-500/30"
        style={{ width: core, height: core }}
      />
    </div>
  );
}
