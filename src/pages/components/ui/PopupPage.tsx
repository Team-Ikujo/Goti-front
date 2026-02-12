import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/shared/ui/dialog';

const PopupPage = () => {
   const [isControlledOpen, setIsControlledOpen] = useState(false);

   return (
      <div className="flex min-h-screen flex-col gap-12 bg-[var(--background-base)] p-8">
         <div className="flex flex-col gap-2">
            <h1 className="text-heading-2-bold [color:var(--text-primary)]">Popup</h1>
            <p className="text-body-2-regular [color:var(--text-secondary)]">
               공용 Dialog 컴포넌트 동작을 확인하기 위한 테스트 페이지입니다.
            </p>
         </div>

         <section className="flex flex-col gap-4">
            <h2 className="text-heading-4-medium [color:var(--text-primary)]">기본 팝업</h2>
            <Dialog>
               <DialogTrigger asChild>
                  <Button>기본 팝업 열기</Button>
               </DialogTrigger>
               <DialogContent maxWidth="80vw">
                  <DialogHeader>
                     <DialogTitle>기본 팝업 타이틀</DialogTitle>
                     <DialogDescription>우측 상단 닫기 버튼과 ESC 키로 닫을 수 있습니다.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter showCloseButton />
               </DialogContent>
            </Dialog>
         </section>

         <section className="flex flex-col gap-4">
            <h2 className="text-heading-4-medium [color:var(--text-primary)]">닫기 아이콘 비노출</h2>
            <Dialog>
               <DialogTrigger asChild>
                  <Button variant="outline">아이콘 없는 팝업 열기</Button>
               </DialogTrigger>
               <DialogContent showCloseButton={false} maxWidth={420}>
                  <DialogHeader>
                     <DialogTitle>닫기 아이콘 없음</DialogTitle>
                     <DialogDescription>푸터 버튼으로만 닫히는지 확인할 수 있습니다.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter showCloseButton />
               </DialogContent>
            </Dialog>
         </section>

         <section className="flex flex-col gap-4">
            <h2 className="text-heading-4-medium [color:var(--text-primary)]">제어형 팝업</h2>
            <div className="flex items-center gap-3">
               <Button onClick={() => setIsControlledOpen(true)}>제어형 열기</Button>
               <Button variant="outline" onClick={() => setIsControlledOpen(false)}>
                  외부에서 닫기
               </Button>
            </div>
            <Dialog open={isControlledOpen} onOpenChange={setIsControlledOpen}>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>제어형 상태 테스트</DialogTitle>
                     <DialogDescription>`open` / `onOpenChange` 기반으로 외부 상태와 연동됩니다.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter showCloseButton />
               </DialogContent>
            </Dialog>
         </section>
      </div>
   );
};

export default PopupPage;
