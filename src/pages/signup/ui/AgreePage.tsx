import { TERMS_DATA } from '@/shared/lib/agreePopup';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { TermsCheckbox, TermsSubItem } from '@/shared/ui/terms-of-service';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AgreePage = () => {
   const navigate = useNavigate();
   const [isChecked, setIsChecked] = useState(false);
   const [subItem1, setSubItem1] = useState(false);
   const [subItem2, setSubItem2] = useState(false);
   const [modal, setModal] = useState<string | null>(null);

   const currentModal = modal ? TERMS_DATA[modal as keyof typeof TERMS_DATA] : null;

   const handleAllCheck = (checked: boolean) => {
      setIsChecked(checked);
      setSubItem1(checked);
      setSubItem2(checked);
   };

   const handleSubItem1Change = (checked: boolean) => {
      setSubItem1(checked);
      setIsChecked(checked && subItem2);
   };

   const handleSubItem2Change = (checked: boolean) => {
      setSubItem2(checked);
      setIsChecked(checked && subItem1);
   };

   return (
      <div
         className="bg-white text-(--color-foreground)
      flex flex-col justify-center items-center min-h-screen"
      >
         <div className="flex flex-col flex-1 py-20 gap-10">
            <div className="flex flex-col text-center">
               <p className="text-heading-1-bold">약관에 동의하고</p>
               <p className="text-heading-1-bold">본인 인증을 진행해 주세요</p>
            </div>
            <div className="flex flex-col gap-1 w-95 justify-center">
               <TermsCheckbox id="terms" label="전체 동의" checked={isChecked} onChange={handleAllCheck} />
               <div>
                  <TermsSubItem
                     id="sub-item-1"
                     label="(필수) 서비스 이용약관 동의"
                     checked={subItem1}
                     onChange={handleSubItem1Change}
                     onTrigger={() => setModal('privacy')}
                  />
                  <TermsSubItem
                     id="sub-item-1"
                     label="(필수) 개인정보 처리 방침 동의"
                     checked={subItem1}
                     onChange={handleSubItem1Change}
                     onTrigger={() => setModal('privacy')}
                  />
                  <TermsSubItem
                     id="sub-item-1"
                     label="(필수) 본인 인증 서비스 이용 동의"
                     checked={subItem1}
                     onChange={handleSubItem1Change}
                     onTrigger={() => setModal('privacy')}
                  />
                  <TermsSubItem
                     id="sub-item-1"
                     label="(필수) 개인정보 제3자 제공 동의"
                     checked={subItem1}
                     onChange={handleSubItem1Change}
                     onTrigger={() => setModal('privacy')}
                  />
                  <TermsSubItem
                     id="sub-item-2"
                     label="(선택) 마케팅 정보 수신 동의"
                     checked={subItem2}
                     onChange={handleSubItem2Change}
                     showTrigger={false}
                  />
               </div>
            </div>
         </div>
         <div className="px-5 pb-5 w-93.75">
            <Button variant="primary" className="w-full" onClick={() => navigate('/auth/signup')}>
               본인 인증하기
            </Button>
         </div>
         {modal && currentModal && (
            <Dialog
               open={!!modal}
               onOpenChange={open => {
                  if (!open) setModal(null);
               }}
            >
               <DialogContent className="flex flex-col overflow-hidden">
                  <DialogHeader>
                     <DialogTitle align="center">{currentModal.title}</DialogTitle>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto px-6 text-body-2-regular text-muted-foreground whitespace-pre-wrap">
                     {currentModal.content}
                  </div>

                  <DialogFooter className="p-6 pt-4 shrink-0">
                     <Button className="w-full" onClick={() => setModal(null)}>
                        {currentModal.button}
                     </Button>
                  </DialogFooter>
               </DialogContent>
            </Dialog>
         )}
      </div>
   );
};

export default AgreePage;
