import { useMutation } from '@tanstack/react-query';
import { sendProfileUpdateSmsCodeMock, updateMemberProfileMock } from '@/entities/user/api/memberApi';

export const useSendProfileEditSmsCode = () => {
   return useMutation({
      mutationFn: sendProfileUpdateSmsCodeMock,
   });
};

export const useSubmitProfileIdentityEdit = () => {
   return useMutation({
      mutationFn: updateMemberProfileMock,
   });
};
