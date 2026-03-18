import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { TermsCheckbox, TermsSubItem } from '@/shared/ui/terms-of-service';
import type { TermAgreementCode } from '@/entities/terms/model/types';
import {
   verificationTermsAgreements,
   verificationTermsDetailByCode,
} from '@/pages/auth/verification-flow/model/verificationTerms';

const VerificationFlowPage = () => {
   const navigate = useNavigate();
   const hasHydrated = useAuthStore(state => state.hasHydrated);
   const accessToken = useAuthStore(state => state.accessToken);
   const socialVerifyToken = useAuthStore(state => state.socialVerifyToken);
   const agreements = verificationTermsAgreements;
   const [checkedByCode, setCheckedByCode] = useState<Partial<Record<TermAgreementCode, boolean>>>({});

   const [detailTargetCode, setDetailTargetCode] = useState<TermAgreementCode | null>(null);
   const termDetail = detailTargetCode ? verificationTermsDetailByCode[detailTargetCode] : null;
   const [detailTriggerElement, setDetailTriggerElement] = useState<HTMLElement | null>(null);

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
      if (!hasHydrated) {
         return;
      }

      if (accessToken) {
         navigate('/', { replace: true });
         return;
      }

      if (!socialVerifyToken) {
         navigate('/auth/login', { replace: true });
      }
   }, [accessToken, hasHydrated, navigate, socialVerifyToken]);

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
