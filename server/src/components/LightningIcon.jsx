import "../App.css";

export function LightningIcon({ size = 24 }) {
  return (
    <span className="frozen-icon"><svg  width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M13 2L5 13H11L10 22L19 10H13L13 2Z"
        fill="#FACC15"
        stroke="#111111"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg></span>
  );
}