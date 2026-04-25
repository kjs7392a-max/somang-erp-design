type Props = {
  name: string;
  size?: number;
  rotate?: number;
  isRejected?: boolean;
};

export function ApprovalStamp({ name, size = 56, rotate = -7, isRejected = false }: Props) {
  if (isRejected) {
    return (
      <div
        style={{
          width: size, height: size * 0.6,
          border: `${Math.max(2, Math.floor(size * 0.04))}px solid #c1272d`,
          color: "#c1272d", display: "flex", alignItems: "center", justifyContent: "center",
          transform: `rotate(-7deg)`, opacity: 0.88,
          fontFamily: '"Noto Serif KR", serif', fontWeight: 800,
          fontSize: size * 0.28, letterSpacing: "0.05em",
        }}
      >
        반려
      </div>
    );
  }

  const chars = name.length >= 3 ? name.split("") : (name + "印").split("");
  const fontSize =
    chars.length === 2 ? size * 0.42 :
    chars.length === 3 ? size * 0.34 : size * 0.30;

  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        border: `${Math.max(2, Math.floor(size * 0.05))}px solid #c1272d`,
        color: "#c1272d",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: `rotate(${rotate}deg)`,
        opacity: 0.92,
        fontFamily: '"Noto Serif KR", serif',
        fontWeight: 800,
        letterSpacing: chars.length >= 3 ? "-0.05em" : "-0.02em",
        fontSize,
        lineHeight: 1,
        filter: "blur(0.2px)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {chars.map((c, i) => <span key={i}>{c}</span>)}
      </div>
    </div>
  );
}
