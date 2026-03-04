const BaseballIcon = ({ className }: { className?: string }) => {
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
        d="M8.00001 14.1538C11.3987 14.1538 14.1539 11.3987 14.1539 7.99998C14.1539 4.6013 11.3987 1.84613 8.00001 1.84613C4.60133 1.84613 1.84616 4.6013 1.84616 7.99998C1.84616 11.3987 4.60133 14.1538 8.00001 14.1538Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M4.92308 4.9231C5.53847 6.15386 5.53847 9.84617 4.92308 11.0769M11.0769 4.9231C10.4615 6.15386 10.4615 9.84617 11.0769 11.0769"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default BaseballIcon;
