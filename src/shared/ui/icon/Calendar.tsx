const CalendarIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="3.33333"
        width="12"
        height="10.6667"
        rx="1.33333"
        stroke="currentColor"
        strokeWidth="1.33333"
      />
      <path
        d="M5 2V4.66667M11 2V4.66667M2 6.66667H14"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CalendarIcon;
