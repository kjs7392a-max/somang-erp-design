/**
 * 하단 탭 «홈» 아이콘 (지정 SVG)
 * `stroke`는 부모 `currentColor`에 의존하지 않고 명시적으로 전달 (일부 환경에서 색이 안 바뀌는 문제 방지)
 */
export function HomeTabIcon({
  stroke,
  className,
}: {
  stroke: string;
  className?: string;
}) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3.5 10.5L12 3.5L20.5 10.5" />
      <path d="M6 9.5V20H18V9.5" />
      <path d="M10 20V14H14V20" />
    </svg>
  );
}
