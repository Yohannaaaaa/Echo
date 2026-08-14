export default function EchoMark({ size = 112, animated = true }: { size?: number; animated?: boolean }) {
  const core = size * 0.44;
  const eclipseInset = Math.max(core * 0.32, 3);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {animated ? (
        <>
          <span className="echo-ring" />
          <span className="echo-ring" style={{ animationDelay: '1.0667s' }} />
          <span className="echo-ring" style={{ animationDelay: '2.1333s' }} />
        </>
      ) : (
        <span className="echo-ring" style={{ animation: 'none', opacity: 0.28, transform: 'scale(0.82)' }} />
      )}
      <div
        className="relative rounded-full bg-gradient-to-br from-echo-500 to-glow-400 shadow-lg shadow-echo-500/40"
        style={{ width: core, height: core }}
      >
        <div className="absolute rounded-full bg-night-950" style={{ inset: eclipseInset }} />
      </div>
    </div>
  );
}
