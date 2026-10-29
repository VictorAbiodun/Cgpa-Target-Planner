export function VaoLogo({
  height = 20,
  className = '',
  color = 'currentColor',
  accent = '#00D29D',
  showSubtext = false,
}) {
  return (
    <svg
      viewBox={showSubtext ? '0 0 520 190' : '0 0 515 140'}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VAO - Technology for a bigger tomorrow"
      style={{ display: 'inline-block', verticalAlign: 'middle', height, width: 'auto' }}
    >
      {/* V */}
      <path
        d="M20 15L100 135L180 15H138L100 78L62 15H20Z"
        fill={color}
      />

      {/* A Outer */}
      <path
        d="M265 15L185 135H230L265 78L300 135H345L265 15Z"
        fill={color}
      />

      {/* A Teal Inner Triangle */}
      <polygon
        points="265,72 232,128 298,128"
        fill={accent}
      />

      {/* O Outer + Inner Ring */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M425 15C391.863 15 365 41.8629 365 75C365 108.137 391.863 135 425 135C458.137 135 485 108.137 485 75C485 41.8629 458.137 15 425 15ZM425 45C408.431 45 395 58.4315 395 75C395 91.5685 408.431 105 425 105C441.569 105 455 91.5685 455 75C455 58.4315 441.569 45 425 45Z"
        fill={color}
      />

      {/* O Teal Horizontal Line */}
      <rect
        x="442"
        y="70"
        width="54"
        height="10"
        rx="2"
        fill={accent}
      />

      {/* Subtext */}
      {showSubtext && (
        <text
          x="260"
          y="178"
          textAnchor="middle"
          fill={color}
          fontSize="17"
          fontWeight="600"
          letterSpacing="0.32em"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          opacity="0.8"
        >
          TECHNOLOGY FOR A BIGGER TOMORROW
        </text>
      )}
    </svg>
  );
}

export default VaoLogo;
