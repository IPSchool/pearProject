export function PearLogo({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-xl bg-accent/15 text-accent font-bold"
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      🍐
    </span>
  );
}
