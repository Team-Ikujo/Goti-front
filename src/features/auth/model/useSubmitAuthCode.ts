import { useMutation } from "@tanstack/react-query";
import { submitAuthCode } from "../api/submitAuthCode";

export const useSubmitAuthCode = () => {
  return useMutation({
    mutationFn: submitAuthCode,
  });
};
