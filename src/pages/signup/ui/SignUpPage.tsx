import type { TermSignUpCode } from '@/entities/terms/model/types';
import { useTermDetailQuery, useTermsAgreementListQuery } from '@/entities/terms/model/useTermsQueries';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Option } from '@/shared/ui/option';
import { KeyValueTable } from '@/shared/ui/table';
import { cn } from '@/shared/lib/utils';
import { TermsCheckbox, TermsSubItem } from '@/shared/ui/terms-of-service';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const telecomOptions = [
   { id: 'skt', name: 'SKT' },
   { id: 'kt', name: 'KT' },
   { id: 'lgu', name: 'LG U+' },
   { id: 'skt_mvno', name: 'SKT 알뜰폰' },
   { id: 'kt_mvno', name: 'KT 알뜰폰' },
   { id: 'lgu_mvno', name: 'LG U+ 알뜰폰' },
];

const SignUpPage = () => {
   const navigate = useNavigate();
   const termsSignuptListQuery = useTermsAgreementListQuery('signup');
   const signups = termsSignuptListQuery.data ?? [];
   const [checkedByCode, setCheckedByCode] = useState<Partial<Record<TermSignUpCode, boolean>>>({});
   const [selected, setSelected] = useState<string | null>(null);

   const [name, setName] = useState('');
   const [birthDate, setBirthDate] = useState('');
   const [gender, setGender] = useState<string | null>(null);
   const [telecom, setTelecom] = useState<string | null>(null);
   const [phone, setPhone] = useState('');
   const [verificationCode, setVerificationCode] = useState('');
   const [countdown, setCountdown] = useState(0);

   const [isCodeSent, setIsCodeSent] = useState(false);
   const [showAlert, setShowAlert] = useState(false);
   const [submitted, setSubmitted] = useState(false);

   const [detailTargetCode, setDetailTargetCode] = useState<TermSignUpCode | null>(null);
   const termDetailQuery = useTermDetailQuery(detailTargetCode);
   const [detailTriggerElement, setDetailTriggerElement] = useState<HTMLElement | null>(null);

   const areRequiredTermsChecked = useMemo(() => {
      return signups.every(signup => {
         if (!signup.required) {
            return true;
         }
         return checkedByCode[signup.code] === true;
      });
   }, [signups, checkedByCode]);

   const isAllChecked = useMemo(() => {
      return signups.length > 0 && signups.every(signup => checkedByCode[signup.code] === true);
   }, [signups, checkedByCode]);

   const handleAllCheckedChange = (checked: boolean) => {
      const nextState: Partial<Record<TermSignUpCode, boolean>> = {};
      signups.forEach(signup => {
         nextState[signup.code] = checked;
      });
      setCheckedByCode(nextState);
   };

   const handleSendCode = () => {
      // 버튼이 비활성화 상태일 수 있지만, 방어 코드를 추가합니다.
      if (!phone || !areRequiredTermsChecked) return;
      setIsCodeSent(true);
      setShowAlert(true);
      setCountdown(180); // 3분(180초)으로 타이머 설정
   };

   // countdown 타이머를 위한 useEffect
   useEffect(() => {
      if (countdown <= 0) return;
      const timer = setInterval(() => {
         setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
   }, [countdown]);

   // 남은 시간을 MM:SS 형식으로 포맷
   const formattedCountdown = useMemo(() => {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
   }, [countdown]);

   useEffect(() => {
      if (!showAlert) return;
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
   }, [showAlert]);

   const handleSubmit = () => {
      setSubmitted(true);

      const hasErrors = !name || !birthDate || !phone || !verificationCode;
      if (hasErrors) return;

      // 회원가입 완료 처리
      navigate('/');
   };

   const closeDetailDialog = () => {
      setDetailTargetCode(null);
      if (detailTriggerElement) {
         requestAnimationFrame(() => {
            detailTriggerElement.focus();
         });
      }
   };

   const handleOpenDetail = (code: TermSignUpCode, trigger?: HTMLElement) => {
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
      <div
         className="min-h-screen bg-white text-(--color-foreground)
      flex items-center justify-center"
      >
         <section className="w-full max-w-md p-8">
            <div className="text-center">
               <h2 className="text-2xl font-semibold">본인 확인을 위해 </h2>
               <h2 className="text-2xl font-semibold">인증을 진행해주세요</h2>
            </div>
            <form className="space-y-5" onSubmit={e => e.preventDefault()}>
               <Input
                  label="이름"
                  required
                  placeholder="30자 이내 입력"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  error={submitted && !name}
                  helpText={submitted && !name ? '이름을 입력해주세요' : undefined}
               />
               <div className="text-(--label-2-medium) text-[14px] flex flex-col gap-1">
                  국적
                  <div className="flex items-center gap-2">
                     <Option active={selected === 'local'} onClick={() => setSelected('local')} className="w-full">
                        내국인
                     </Option>
                     <Option
                        active={selected === 'foreigner'}
                        onClick={() => setSelected('foreigner')}
                        className="w-full"
                     >
                        외국인
                     </Option>
                  </div>
               </div>
               <Input
                  label="생년월일"
                  required
                  placeholder="예: 19990101 (8자리)"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  error={submitted && !birthDate}
                  helpText={submitted && !birthDate ? '생년월일을 입력해주세요' : undefined}
               />
               <div className="text-(--label-2-medium) text-[14px] flex flex-col gap-1">
                  성별
                  <div className="flex items-center gap-2">
                     <Option active={gender === 'male'} onClick={() => setGender('male')} className="w-full">
                        남성
                     </Option>
                     <Option active={gender === 'female'} onClick={() => setGender('female')} className="w-full">
                        여성
                     </Option>
                  </div>
               </div>
               <div className="text-(--label-2-medium) text-[14px] flex flex-col gap-1">
                  통신사
                  <div className="grid grid-cols-3 gap-2">
                     {telecomOptions.map(option => (
                        <Option
                           key={option.id}
                           active={telecom === option.id}
                           onClick={() => setTelecom(option.id)}
                           className="w-full"
                        >
                           {option.name}
                        </Option>
                     ))}
                  </div>
               </div>
               <Input
                  label="휴대폰 번호"
                  required
                  placeholder="'-'를 제외한 숫자만 입력"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  error={submitted && !phone}
                  helpText={submitted && !phone ? '필수 입력 항목입니다' : undefined}
               />
               {isCodeSent && (
                  <div>
                     <div className="flex flex-col gap-1">
                        <label className="text-label-2-medium text-[14px] text-muted-foreground">
                           인증 번호
                           <span className="text-primary">*</span>
                        </label>
                        <div className="relative w-full">
                           <input
                              type="text"
                              placeholder="인증 번호 6자리"
                              value={verificationCode}
                              onChange={e => setVerificationCode(e.target.value)}
                              aria-invalid={(submitted && !verificationCode) || undefined}
                              className={cn(
                                 'h-12 w-full rounded-lg border px-4 py-3 outline-none transition-colors antialiased',
                                 'text-foreground',
                                 'placeholder:text-disabled-foreground',
                                 'focus:border-(--border-heavy)',
                                 submitted && !verificationCode && 'border-destructive focus:border-destructive',
                              )}
                           />
                           {countdown > 0 && (
                              <div className="absolute inset-y-0 right-4 flex items-center text-primary">
                                 {formattedCountdown}
                              </div>
                           )}
                        </div>
                        {submitted && !verificationCode && (
                           <p className="text-xs text-destructive antialiased">인증번호를 입력해주세요</p>
                        )}
                     </div>
                     {countdown <= 0 && (
                        <button
                           type="button"
                           onClick={handleSendCode}
                           className="underline text-(--text-tertiary) text-right w-full mt-1"
                        >
                           인증번호 재전송
                        </button>
                     )}
                  </div>
               )}
               {!isCodeSent && (
                  <div className="flex flex-col gap-1 w-95 justify-center">
                     <TermsCheckbox
                        id="terms-all"
                        label="전체 동의"
                        checked={isAllChecked}
                        onChange={handleAllCheckedChange}
                     />
                     <div>
                        {signups.map(signup => (
                           <TermsSubItem
                              key={signup.code}
                              id={`term-${signup.code}`}
                              label={signup.label}
                              checked={Boolean(checkedByCode[signup.code])}
                              onChange={checked =>
                                 setCheckedByCode(prev => ({
                                    ...prev,
                                    [signup.code]: checked === true,
                                 }))
                              }
                              showTrigger={signup.hasDetail}
                              onTrigger={() => handleOpenDetail(signup.code)}
                           />
                        ))}
                     </div>
                  </div>
               )}
               {!isCodeSent ? (
                  <Button
                     type="button"
                     variant="primary"
                     className="w-full"
                     disabled={!phone || !areRequiredTermsChecked}
                     onClick={handleSendCode}
                  >
                     인증 번호 전송
                  </Button>
               ) : (
                  <Button type="button" variant="primary" className="w-full" onClick={handleSubmit}>
                     완료
                  </Button>
               )}
            </form>
            <Dialog
               open={Boolean(detailTargetCode)}
               onOpenChange={open => {
                  if (!open) {
                     closeDetailDialog();
                  }
               }}
            >
               <DialogContent className="flex flex-col overflow-hidden max-w-147 w-[calc(100%-40px)] gap-0 border-0 p-0">
                  {termDetailQuery.isLoading ? (
                     <div className="p-10 text-center text-body-2-regular text-muted-foreground">
                        약관 내용을 불러오는 중입니다.
                     </div>
                  ) : termDetailQuery.data ? (
                     <>
                        <DialogHeader>
                           <DialogTitle align="center">{termDetailQuery.data.title}</DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-5 pb-5">
                           <div className="rounded-lg border border-(--neutral-200) p-4">
                              <p className="text-body-2-regular leading-6 text-muted-foreground">
                                 {termDetailQuery.data.summary}
                                 <br />
                                 <br />
                                 {termDetailQuery.data.scopeTitle}
                              </p>

                              <KeyValueTable
                                 className="mt-4"
                                 rows={[
                                    { label: '수집·이용 목적', value: termDetailQuery.data.purpose },
                                    { label: '수집하는 개인정보 항목', value: termDetailQuery.data.fields },
                                    { label: '보유·이용하는 기간', value: termDetailQuery.data.retention },
                                    { label: '수집·이용하는 자', value: termDetailQuery.data.collector },
                                 ]}
                              />

                              <p className="mt-4 text-body-2-regular leading-6 text-muted-foreground">
                                 {termDetailQuery.data.footerNote}
                              </p>
                           </div>
                        </div>

                        <DialogFooter className="p-5 pt-0 shrink-0">
                           <Button
                              type="button"
                              variant="primary"
                              className="h-12 w-full"
                              onClick={handleAgreeAndClose}
                           >
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
         </section>

         {showAlert && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <Alert variant="success">인증번호가 전송되었습니다</Alert>
            </div>
         )}
      </div>
   );
};

export default SignUpPage;
