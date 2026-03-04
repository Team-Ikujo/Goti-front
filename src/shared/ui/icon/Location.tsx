const LocationIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 14.3333C9.76667 12.8333 12.6667 10.0833 12.6667 6.66667C12.6667 4.08934 10.5773 2 8 2C5.42267 2 3.33334 4.08934 3.33334 6.66667C3.33334 10.0833 6.23334 12.8333 8 14.3333Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="8"
        cy="6.66667"
        r="1.66667"
        stroke="currentColor"
        strokeWidth="1.33333"
      />
    </svg>
  );
};

export default LocationIcon;
