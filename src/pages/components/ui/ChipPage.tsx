import { Badge } from "@/shared/ui/badge";
import BaseballIcon from "@/shared/ui/icon/Baseball";
import { Check } from "lucide-react";

const Chip = () => {
  return (
    <div className="flex flex-col gap-8 p-6 bg-white">
      <h1 className="text-heading-2-bold">Chip</h1>
      <div className="flex flex-col gap-4">
        <h2 className="text-heading-4-medium">text only</h2>
        <Badge variant={"chip"}>Team Name</Badge>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-heading-4-medium">with svg icon (lucide)</h2>
        <Badge variant={"chip"}>
          <Check aria-hidden="true" />
          인증 완료
        </Badge>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-heading-4-medium">with custom color icon</h2>
        <Badge variant={"chip"}>
          <BaseballIcon className="size-4 text-primary-strong" />
          Team Name
        </Badge>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-heading-4-medium">Destructive</h2>
        <Badge variant="chipDestructive">마감 임박</Badge>
      </div>
    </div>
  );
};

export default Chip;
