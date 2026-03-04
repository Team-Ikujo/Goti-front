import type { TermsDetail } from '@/entities/terms/model/types';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { KeyValueTable } from '@/shared/ui/table';

type SignUpTermsDialogProps = {
   open: boolean;
   isLoading: boolean;
   detail?: TermsDetail;
   onOpenChange: (open: boolean) => void;
   onAgreeAndClose: () => void;
};

const SignUpTermsDialog = ({ open, isLoading, detail, onOpenChange, onAgreeAndClose }: SignUpTermsDialogProps) => {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="flex flex-col overflow-hidden max-w-147 w-[calc(100%-40px)] gap-0 border-0 p-0">
            {isLoading ? (
               <div className="p-10 text-center text-body-2-regular text-muted-foreground">약관 내용을 불러오는 중입니다.</div>
            ) : detail ? (
               <>
                  <DialogHeader>
                     <DialogTitle align="center">{detail.title}</DialogTitle>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto px-5 pb-5">
                     <div className="rounded-lg border border-(--neutral-200) p-4">
                        <p className="text-body-2-regular leading-6 text-muted-foreground">
                           {detail.summary}
                           <br />
                           <br />
                           {detail.scopeTitle}
                        </p>

                        <KeyValueTable
                           className="mt-4"
                           rows={[
                              { label: '수집·이용 목적', value: detail.purpose },
                              { label: '수집하는 개인정보 항목', value: detail.fields },
                              { label: '보유·이용하는 기간', value: detail.retention },
                              { label: '수집·이용하는 자', value: detail.collector },
                           ]}
                        />

                        <p className="mt-4 text-body-2-regular leading-6 text-muted-foreground">{detail.footerNote}</p>
                     </div>
                  </div>

                  <DialogFooter className="p-5 pt-0 shrink-0">
                     <Button type="button" variant="primary" className="h-12 w-full" onClick={onAgreeAndClose}>
                        동의 후 닫기
                     </Button>
                  </DialogFooter>
               </>
            ) : (
               <div className="p-10 text-center text-body-2-regular text-muted-foreground">표시할 약관 상세가 없습니다.</div>
            )}
         </DialogContent>
      </Dialog>
   );
};

export default SignUpTermsDialog;
