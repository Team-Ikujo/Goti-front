import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { TermsCheckbox, TermsSubItem } from '@/shared/ui/terms-of-service';
import { useTermDetailQuery, useTermsAgreementListQuery } from '@/entities/terms/model/useTermsQueries';
import type { TermCode } from '@/entities/terms/model/types';

const VerificationFlowPage = () => {
   const navigate = useNavigate();
   const termsAgreementListQuery = useTermsAgreementListQuery();
   const agreements = termsAgreementListQuery.data ?? [];
   const [checkedByCode, setCheckedByCode] = useState<Partial<Record<TermCode, boolean>>>({});

   const [detailTargetCode, setDetailTargetCode] = useState<TermCode | null>(null);
   const termDetailQuery = useTermDetailQuery(detailTargetCode);
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
      return agreements.length > 0 && agreements.every(agreement => checkedByCode[agreement.code] === true);
   }, [agreements, checkedByCode]);

   const handleAllCheckedChange = (checked: boolean) => {
      const nextState: Partial<Record<TermCode, boolean>> = {};
      agreements.forEach(agreement => {
         nextState[agreement.code] = checked;
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

   const handleOpenDetail = (code: TermCode, trigger?: HTMLElement) => {
      if (trigger) setDetailTriggerElement(trigger);
      setDetailTargetCode(code);
   };

   const handleAgreeAndClose = () => {
      if (detailTargetCode) {
         setCheckedByCode(prev => ({ ...prev, [detailTargetCode]: true }));
      }
      closeDetailDialog();
   };

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
               {termDetailQuery.isLoading ? (
                  <div className="p-10 text-center text-body-2-regular text-muted-foreground">
                     약관 내용을 불러오는 중입니다.
                  </div>
               ) : termDetailQuery.data ? (
                  <>
                     <DialogHeader className="px-5 py-5 pb-2">
                        <DialogTitle align="center" className="text-heading-4-bold">
                           {termDetailQuery.data.title}
                        </DialogTitle>
                     </DialogHeader>

                     {/* 스크롤 가능한 영역 (상세 약관 내용) */}
                     <div className="flex-1 overflow-y-auto px-5 pb-5">
                        <div className="rounded-lg border border-(--neutral-200) p-4">
                           <p className="text-body-2-regular leading-6 text-muted-foreground">
                              {termDetailQuery.data.summary}
                              <br />
                              <br />
                              {termDetailQuery.data.scopeTitle}
                           </p>

                           <div className="mt-4 border-t border-border">
                              <div className="grid grid-cols-[126px_1fr] border-b border-border">
                                 <div className="bg-(--neutral-50) p-2 text-center text-caption-1-bold text-muted-foreground">
                                    수집·이용 목적
                                 </div>
                                 <div className="p-2 text-caption-1-regular text-muted-foreground">
                                    {termDetailQuery.data.purpose}
                                 </div>
                              </div>
                              <div className="grid grid-cols-[126px_1fr] border-b border-border">
                                 <div className="bg-(--neutral-50) p-2 text-center text-caption-1-bold text-muted-foreground">
                                    수집하는 개인정보 항목
                                 </div>
                                 <div className="p-2 text-caption-1-regular text-muted-foreground">
                                    {termDetailQuery.data.fields}
                                 </div>
                              </div>
                              <div className="grid grid-cols-[126px_1fr] border-b border-border">
                                 <div className="bg-(--neutral-50) p-2 text-center text-caption-1-bold text-muted-foreground">
                                    보유·이용하는 기간
                                 </div>
                                 <div className="p-2 text-caption-1-regular text-muted-foreground">
                                    {termDetailQuery.data.retention}
                                 </div>
                              </div>
                              <div className="grid grid-cols-[126px_1fr] border-b border-border">
                                 <div className="bg-(--neutral-50) p-2 text-center text-caption-1-bold text-muted-foreground">
                                    수집·이용하는 자
                                 </div>
                                 <div className="p-2 text-caption-1-regular text-muted-foreground">
                                    {termDetailQuery.data.collector}
                                 </div>
                              </div>
                           </div>

                           <p className="mt-4 text-body-2-regular leading-6 text-muted-foreground">
                              {termDetailQuery.data.footerNote}
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
