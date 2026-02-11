import { Badge } from "@/shared/ui/badge";
const RecentLoginBadge = () => {
  return (
    <Badge
      variant="default"
      className="pointer-events-none absolute -top-2 -left-2 z-10 rounded-sm px-2 py-0.5 text-white text-[11px] font-bold bg-neutral-800"
    >
      최근 로그인
    </Badge>
  );
};

export default RecentLoginBadge;
