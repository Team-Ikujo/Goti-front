import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';

const TERMS_ONLY_LIST = [
   '(필수) 서비스 이용약관 동의',
   '(필수) 개인정보 처리 방침 동의',
   '(필수) 본인 인증 서비스 이용 동의',
   '(필수) 개인정보 제3자 제공 동의',
   '(선택) 마케팅 정보 수신 동의',
] as const;

const VerificationFlowPage = () => {
   const navigate = useNavigate();
   const [checkedItems, setCheckedItems] = useState<boolean[]>(Array(TERMS_ONLY_LIST.length).fill(false));

   const areRequiredTermsChecked = useMemo(() => checkedItems.slice(0, 4).every(Boolean), [checkedItems]);

   const handleAllCheckedChange = (checked: boolean | 'indeterminate') => {
      setCheckedItems(Array(TERMS_ONLY_LIST.length).fill(checked === true));
   };

   const handleItemCheckedChange = (index: number, checked: boolean | 'indeterminate') => {
      const next = [...checkedItems];
      next[index] = checked === true;
      setCheckedItems(next);
   };

   const handleProceedToSignup = () => {
      if (!areRequiredTermsChecked) {
         return;
      }
      navigate('/auth/signup');
   };

   return (
      <div className="min-h-screen bg-background text-foreground">
         <main className="mx-auto flex min-h-screen w-full max-w-[1200px] px-5">
            <section className="mx-auto flex w-full max-w-[380px] flex-1 flex-col pt-20">
               <h1 className="pb-10 text-center text-heading-1-bold text-foreground">
                  약관에 동의하고
                  <br />
                  본인 인증을 진행해 주세요
               </h1>

               <div className="space-y-1">
                  <label className="flex items-center gap-2 rounded-lg bg-(--neutral-50) px-4 py-3">
                     <Checkbox checked={checkedItems.every(Boolean)} onCheckedChange={handleAllCheckedChange} size="lg" />
                     <span className="text-body-1-medium text-foreground">전체동의</span>
                  </label>

                  <div>
                     {TERMS_ONLY_LIST.map((agreement, index) => (
                        <div key={agreement} className="flex items-center gap-1 rounded-lg">
                           <label className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5">
                              <Checkbox
                                 size="md"
                                 checked={checkedItems[index]}
                                 onCheckedChange={checked => handleItemCheckedChange(index, checked)}
                              />
                              <span className="text-body-2-medium text-muted-foreground">{agreement}</span>
                           </label>
                           <button
                              type="button"
                              aria-label={`${agreement} 상세 보기`}
                              className="flex shrink-0 items-center p-2 text-muted-foreground"
                           >
                              <ChevronRight className="size-4" />
                           </button>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="mx-auto mt-auto w-full max-w-[375px] px-5 pb-5">
                  <Button type="button" className="w-full" disabled={!areRequiredTermsChecked} onClick={handleProceedToSignup}>
                     본인 인증하기
                  </Button>
               </div>
            </section>
         </main>
      </div>
   );
};

export default VerificationFlowPage;
