import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyProfile, updateMyProfile, type MemberProfile } from '@/entities/user/api/memberApi';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { TermsCheckbox, TermsSubItem } from '@/shared/ui/terms-of-service';
import type { TermAgreementCode } from '@/entities/terms/model/types';
import { normalizePhoneInput } from '@/pages/signup/model/signUpValidation';
import {
   verificationTermsAgreements,
   verificationTermsDetailByCode,
} from '@/pages/auth/verification-flow/model/verificationTerms';

type VerificationFlowLocationState = {
   mode?: 'profile-edit';
   profile?: Pick<MemberProfile, 'name' | 'mobile' | 'gender' | 'birthDate'>;
};

const VerificationFlowPage = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const queryClient = useQueryClient();
   const hasResolvedSession = useAuthStore(state => state.hasResolvedSession);
   const accessToken = useAuthStore(state => state.accessToken);
   const socialVerifyToken = useAuthStore(state => state.socialVerifyToken);
   const locationState = (location.state as VerificationFlowLocationState | null) ?? null;
   const isProfileEditMode = locationState?.mode === 'profile-edit';
   const agreements = verificationTermsAgreements;
   const [checkedByCode, setCheckedByCode] = useState<Partial<Record<TermAgreementCode, boolean>>>({});
   const [profileName, setProfileName] = useState('');
   const [profileMobile, setProfileMobile] = useState('');
   const [submitError, setSubmitError] = useState<string | null>(null);

   const [detailTargetCode, setDetailTargetCode] = useState<TermAgreementCode | null>(null);
   const termDetail = detailTargetCode ? verificationTermsDetailByCode[detailTargetCode] : null;
   const [detailTriggerElement, setDetailTriggerElement] = useState<HTMLElement | null>(null);

   const profileQuery = useQuery({
      queryKey: ['verificationProfile', accessToken],
      queryFn: fetchMyProfile,
      enabled: isProfileEditMode && Boolean(accessToken),
   });

   const editableProfile = profileQuery.data ?? locationState?.profile;
   const normalizedBirthDate = editableProfile?.birthDate?.replace(/\./g, '-');
   const normalizedMobile = normalizePhoneInput(editableProfile?.mobile ?? '');
   const trimmedProfileName = profileName.trim();
   const trimmedProfileMobile = profileMobile.trim();
   const nameError =
      trimmedProfileName.length === 0
         ? '이름을 입력해주세요'
         : trimmedProfileName.length > 30
            ? '이름은 30자 이내로 입력해주세요'
            : null;
   const phoneError = /^01[0-9]\d{7,8}$/.test(trimmedProfileMobile) ? null : "'-'를 제외한 휴대폰 번호를 정확히 입력해주세요";
   const isProfileSaveEnabled =
      Boolean(editableProfile?.birthDate) &&
      Boolean(editableProfile?.gender) &&
      !nameError &&
      !phoneError;

   const profileUpdateMutation = useMutation({
      mutationFn: () =>
         updateMyProfile({
            name: trimmedProfileName,
            mobile: trimmedProfileMobile,
            gender: editableProfile?.gender ?? 'UNKNOWN',
            birthDate: normalizedBirthDate ?? '1990-01-01',
            authCode: 'PROFILE_EDIT',
         }),
      onSuccess: async () => {
         await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
         navigate('/mypage/account', { replace: true });
      },
      onError: (error) => {
         setSubmitError(error instanceof Error ? error.message : '회원 정보 저장 중 오류가 발생했습니다.');
      },
   });

   const areRequiredTermsChecked = useMemo(() => {
      return agreements.every(agreement => {
         if (!agreement.required) {
            return true;
         }
         return checkedByCode[agreement.code] === true;
      });
   }, [agreements, checkedByCode]);

   const isAllChecked = useMemo(() => {
      return areRequiredTermsChecked;
   }, [areRequiredTermsChecked]);

   const handleAllCheckedChange = (checked: boolean) => {
      const nextState: Partial<Record<TermAgreementCode, boolean>> = {};
      agreements.forEach(agreement => {
         nextState[agreement.code] = checked && agreement.required;
      });
      setCheckedByCode(nextState);
   };

   const handleProceedToSignup = () => {
      if (!areRequiredTermsChecked) {
         return;
      }
      navigate('/auth/signup');
   };

   const closeDetailDialog = () => {
      setDetailTargetCode(null);
      if (detailTriggerElement) {
         requestAnimationFrame(() => {
            detailTriggerElement.focus();
         });
      }
   };

   const handleOpenDetail = (code: TermAgreementCode, trigger?: HTMLElement) => {
      if (trigger) setDetailTriggerElement(trigger);
      setDetailTargetCode(code);
   };

   const handleAgreeAndClose = () => {
      if (detailTargetCode) {
         setCheckedByCode(prev => ({ ...prev, [detailTargetCode]: true }));
      }
      closeDetailDialog();
   };

   useEffect(() => {
      if (!isProfileEditMode) {
         return;
      }

      setProfileName(editableProfile?.name ?? '');
      setProfileMobile(normalizedMobile);
   }, [editableProfile?.name, isProfileEditMode, normalizedMobile]);

   useEffect(() => {
      if (!hasResolvedSession) {
         return;
      }

      if (!isProfileEditMode && accessToken) {
         navigate('/', { replace: true });
         return;
      }

      if (isProfileEditMode && !accessToken) {
         navigate('/auth/login', { replace: true });
         return;
      }

      if (!isProfileEditMode && !socialVerifyToken) {
         navigate('/auth/login', { replace: true });
      }
   }, [accessToken, hasResolvedSession, isProfileEditMode, navigate, socialVerifyToken]);

   if (isProfileEditMode) {
      if (profileQuery.isLoading) {
         return (
            <div className="bg-white text-(--color-foreground) flex min-h-screen items-center justify-center">
               <p className="text-body-1-regular text-muted-foreground">본인 인증 정보를 불러오는 중입니다.</p>
            </div>
         );
      }

      return (
         <div className="min-h-screen bg-white text-(--color-foreground) flex items-center justify-center">
            <section className="w-full max-w-md p-8">
               <div className="text-center pb-10">
                  <h2 className="text-2xl font-semibold">본인 인증 정보로</h2>
                  <h2 className="text-2xl font-semibold">회원 정보를 수정해 주세요</h2>
               </div>

               <form
                  className="space-y-5"
                  onSubmit={(event) => {
                     event.preventDefault();

                     if (!isProfileSaveEnabled || profileUpdateMutation.isPending) {
                        return;
                     }

                     setSubmitError(null);
                     profileUpdateMutation.mutate();
                  }}
               >
                  <Input
                     label="이름"
                     required
                     placeholder="30자 이내 입력"
                     maxLength={30}
                     value={profileName}
                     onChange={(event) => {
                        setProfileName(event.target.value.slice(0, 30));
                        setSubmitError(null);
                     }}
                     error={Boolean(nameError)}
                     helpText={nameError ?? undefined}
                  />

                  <Input
                     label="휴대폰 번호"
                     required
                     placeholder="'-'를 제외한 숫자만 입력"
                     value={profileMobile}
                     onChange={(event) => {
                        setProfileMobile(normalizePhoneInput(event.target.value));
                        setSubmitError(null);
                     }}
                     error={Boolean(phoneError)}
                     helpText={phoneError ?? undefined}
                  />

                  <Button type="submit" variant="primary" className="w-full" disabled={!isProfileSaveEnabled || profileUpdateMutation.isPending}>
                     {profileUpdateMutation.isPending ? '저장 중...' : '저장'}
                  </Button>

                  {submitError ? <p className="text-xs text-destructive antialiased">{submitError}</p> : null}
               </form>
            </section>
         </div>
      );
   }

   return (
      <div className="bg-white text-(--color-foreground) flex flex-col justify-center items-center min-h-screen">
         <div className="flex flex-col flex-1 py-20 gap-10">
            <div className="flex flex-col text-center">
               <p className="text-heading-1-bold">약관에 동의하고</p>
               <p className="text-heading-1-bold">본인 인증을 진행해 주세요</p>
            </div>

            <div className="flex flex-col gap-1 w-95 justify-center">
               <TermsCheckbox
                  id="terms-all"
                  label="전체 동의"
                  checked={isAllChecked}
                  onChange={handleAllCheckedChange}
               />
               <div>
                  {agreements.map(agreement => (
                     <TermsSubItem
                        key={agreement.code}
                        id={`term-${agreement.code}`}
                        label={agreement.label}
                        checked={Boolean(checkedByCode[agreement.code])}
                        onChange={checked =>
                           setCheckedByCode(prev => ({
                              ...prev,
                              [agreement.code]: checked === true,
                           }))
                        }
                        showTrigger={agreement.hasDetail}
                        onTrigger={() => handleOpenDetail(agreement.code)}
                     />
                  ))}
               </div>
            </div>
         </div>

         <div className="px-5 pb-5 w-93.75">
            <Button
               variant="primary"
               className="w-full"
               disabled={!areRequiredTermsChecked}
               onClick={handleProceedToSignup}
            >
               본인 인증하기
            </Button>
         </div>

         <Dialog
            open={Boolean(detailTargetCode)}
            onOpenChange={open => {
               if (!open) {
                  closeDetailDialog();
               }
            }}
         >
            <DialogContent className="flex flex-col overflow-hidden max-w-147 w-[calc(100%-40px)] gap-0 rounded-xl border-0 bg-elevated p-0 shadow-xl">
               {termDetail ? (
                  <>
                     <DialogHeader className="px-5 py-5 pb-2">
                        <DialogTitle align="center" className="text-heading-4-bold">
                           {termDetail.title}
                        </DialogTitle>
                     </DialogHeader>

                     {/* 스크롤 가능한 영역 (상세 약관 내용) */}
                     <div className="flex-1 overflow-y-auto px-5 pb-5">
                        <div className="rounded-lg border border-(--neutral-200) p-4">
                           <p className="text-body-2-regular leading-6 text-muted-foreground">
                              {termDetail.summary}
                              <br />
                              <br />
                              {termDetail.scopeTitle}
                           </p>

                           <div className="mt-4 border-t border-border">
                              <div className="grid grid-cols-[126px_1fr] border-b border-border">
                                 <div className="bg-(--neutral-50) p-2 text-center text-caption-1-bold text-muted-foreground">
                                    수집·이용 목적
                                 </div>
                                 <div className="p-2 text-caption-1-regular text-muted-foreground">
                                    {termDetail.purpose}
                                 </div>
                              </div>
                              <div className="grid grid-cols-[126px_1fr] border-b border-border">
                                 <div className="bg-(--neutral-50) p-2 text-center text-caption-1-bold text-muted-foreground">
                                    수집하는 개인정보 항목
                                 </div>
                                 <div className="p-2 text-caption-1-regular text-muted-foreground">
                                    {termDetail.fields}
                                 </div>
                              </div>
                              <div className="grid grid-cols-[126px_1fr] border-b border-border">
                                 <div className="bg-(--neutral-50) p-2 text-center text-caption-1-bold text-muted-foreground">
                                    보유·이용하는 기간
                                 </div>
                                 <div className="p-2 text-caption-1-regular text-muted-foreground">
                                    {termDetail.retention}
                                 </div>
                              </div>
                              <div className="grid grid-cols-[126px_1fr] border-b border-border">
                                 <div className="bg-(--neutral-50) p-2 text-center text-caption-1-bold text-muted-foreground">
                                    수집·이용하는 자
                                 </div>
                                 <div className="p-2 text-caption-1-regular text-muted-foreground">
                                    {termDetail.collector}
                                 </div>
                              </div>
                           </div>

                           <p className="mt-4 text-body-2-regular leading-6 text-muted-foreground">
                              {termDetail.footerNote}
                           </p>
                        </div>
                     </div>

                     <DialogFooter className="p-5 pt-0 shrink-0">
                        <Button type="button" variant="primary" className="h-12 w-full" onClick={handleAgreeAndClose}>
                           동의 후 닫기
                        </Button>
                     </DialogFooter>
                  </>
               ) : (
                  <div className="p-10 text-center text-body-2-regular text-muted-foreground">
                     표시할 약관 상세가 없습니다.
                  </div>
               )}
            </DialogContent>
         </Dialog>
      </div>
   );
};

export default VerificationFlowPage;
