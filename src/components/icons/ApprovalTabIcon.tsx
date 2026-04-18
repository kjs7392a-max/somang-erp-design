/**
 * 하단 탭 «결재» 아이콘 (지정 SVG)
 */
export function ApprovalTabIcon({ stroke }: { stroke: string }) {
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
      aria-hidden
    >
      <path d="M4 4H14L20 10V20H4V4Z" />
      <path d="M14 4V10H20" />
      <path d="M7.5 14.5L11 18L17 11.5" strokeWidth="2.8" />
    </svg>
  );
}
