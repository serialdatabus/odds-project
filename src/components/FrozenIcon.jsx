export function FrozenIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#60A5FA" />
      <path
        d="M12 5V19"
        stroke="#0F172A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8.5 7L15.5 17"
        stroke="#0F172A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15.5 7L8.5 17"
        stroke="#0F172A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 9L18 15"
        stroke="#0F172A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18 9L6 15"
        stroke="#0F172A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}