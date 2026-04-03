// src/pages/tickets/ui/payment/TermsCard.tsx

import { useState } from 'react';
import { Checkbox } from '@/shared/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { KeyValueTable } from '@/shared/ui/table';
import { PaymentCard } from './PaymentCard';

// ─── 개인정보 수집·이용 동의 (기존 SignUpTermsDialog와 동일한 구조) ─────────
export function PrivacyDialog({ open, onClose, onAgree }: { open: boolean; onClose: () => void; onAgree: () => void }) {
   return (
      <Dialog open={open} onOpenChange={v => !v && onClose()}>
         <DialogContent className="flex flex-col overflow-hidden max-w-147 w-[calc(100%-40px)] max-h-[80vh] gap-0 border-0 p-0">
            <DialogHeader>
               <DialogTitle align="center">개인정보 수집·이용 동의</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-5 pb-5">
               <div className="rounded-lg border border-(--neutral-200) p-4">
                  <p className="text-body-2-regular leading-6 text-muted-foreground">
                     개인정보보호법 제15조, 제17조, 제24조에 따라 귀하의 개인정보를 수집·이용 등을 처리합니다. 귀하는
                     아래 내용을 동의하지 않을 수 없으며, 동의하지 않을 경우 자료 불충분으로 서비스 신청이 거절될 수
                     있습니다.
                     <br />
                     <br />
                     개인정보 수집 · 이용에 관한 동의
                  </p>
                  <KeyValueTable
                     className="mt-4"
                     rows={[
                        { label: '수집·이용 목적', value: '관리자 페이지 접근 권한 부여' },
                        { label: '수집하는 개인정보 항목', value: '담당자 식별정보, 부서명, 직위, 성명, 전화번호, 이메일' },
                        { label: '보유·이용하는 기간', value: '개인정보의 수집·이용 동의일부터 계약종료일' },
                        { label: '수집·이용하는 자', value: 'GoTi, 각 구단, KBO' },
                     ]}
                  />
                  <p className="mt-4 text-body-2-regular leading-6 text-muted-foreground">
                     ※ 위 사항에 대하여 설명 받고 이해하였으며, GoTi가 위 개인정보를 수집·이용하는 것에 대해
                     동의합니다.
                  </p>
               </div>
            </div>
            <DialogFooter className="p-5 pt-0 shrink-0">
               <Button type="button" variant="primary" className="h-12 w-full" onClick={onAgree}>
                  동의 후 닫기
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}

// ─── 취소/환불 정책 ─────────────────────────────────────────────────────────
function PolicyDialog({ open, onClose, onAgree }: { open: boolean; onClose: () => void; onAgree: () => void }) {
   return (
      <Dialog open={open} onOpenChange={v => !v && onClose()}>
         <DialogContent className="flex flex-col overflow-hidden max-w-147 w-[calc(100%-40px)] max-h-[80vh] gap-0 border-0 p-0">
            <DialogHeader>
               <DialogTitle align="center">취소/환불 정책</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-5 pb-5">
               <div className="rounded-lg border border-(--neutral-200) p-4 text-body-2-regular leading-6 text-muted-foreground flex flex-col gap-3">
                  <div>
                     <p className="font-semibold text-foreground mb-1">취소 / 환불 정책</p>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">1. 예매 취소 및 환불 기준</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>예매 당일 취소 시
                           <ul className="list-disc pl-5">
                              <li>예매수수료 전액 환불</li>
                              <li>취소수수료 없음</li>
                           </ul>
                        </li>
                        <li>예매 익일 이후 취소 시
                           <ul className="list-disc pl-5">
                              <li>티켓 금액의 10% 취소수수료 발생</li>
                              <li>예매수수료는 환불되지 않음</li>
                           </ul>
                        </li>
                        <li>경기 시작 4시간 전 이후
                           <ul className="list-disc pl-5">
                              <li>취소 및 환불 불가</li>
                           </ul>
                        </li>
                     </ul>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">2. 예매 변경 및 부분 취소</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>경기일자 및 좌석 변경 불가</li>
                        <li>부분 취소 불가
                           <ul className="list-disc pl-5">
                              <li>전체 취소 후 재예매해야 합니다.</li>
                           </ul>
                        </li>
                        <li>취소 후 재예매 시 기존 좌석은 보장되지 않습니다.</li>
                     </ul>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">3. 구매 방법별 환불 안내</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>온라인 / 모바일 / 전화 예매 티켓<br />→ 해당 예매처에서만 환불 가능 (현장 매표소 환불 불가)</li>
                        <li>현장 구매 티켓<br />→ 경기 시작 전까지 환불 가능<br />→ 경기 시작 이후 환불 불가</li>
                     </ul>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">4. 입장 이후 환불</p>
                     <ul className="list-disc pl-5">
                        <li>경기장 입장 후에는 환불이 불가합니다.</li>
                     </ul>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">5. 경기 취소 시 환불</p>
                     <p>다음과 같은 사유로 경기가 취소될 경우 티켓 결제금액 전액 환불됩니다.</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>우천</li>
                        <li>미세먼지</li>
                        <li>기타 기상 악화</li>
                     </ul>
                     <p className="mt-1">단, 아래와 같은 상황 시, 환불이 불가합니다.</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>경기가 정식 경기로 인정되거나</li>
                        <li>서스펜디드 경기로 종료된 경우</li>
                     </ul>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">6. 기타 안내</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>테이블석 등 묶음 좌석은 분할 구매가 불가합니다.<br />(예: 4인 테이블 → 4매 동시 구매 필수)</li>
                        <li>경기장 입장은 경기 시작 2시간 전부터 가능합니다.<br />(구단 사정에 따라 변경될 수 있습니다.)</li>
                     </ul>
                  </div>
               </div>
            </div>
            <DialogFooter className="p-5 pt-0 shrink-0">
               <Button type="button" variant="primary" className="h-12 w-full" onClick={onAgree}>
                  동의 후 닫기
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}

// ─── 리셀 정책 ──────────────────────────────────────────────────────────────
export function ResellPolicyDialog({ open, onClose, onAgree }: { open: boolean; onClose: () => void; onAgree: () => void }) {
   return (
      <Dialog open={open} onOpenChange={v => !v && onClose()}>
         <DialogContent className="flex flex-col overflow-hidden max-w-147 w-[calc(100%-40px)] max-h-[80vh] gap-0 border-0 p-0">
            <DialogHeader>
               <DialogTitle align="center">리셀 정책</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-5 pb-5">
               <div className="rounded-lg border border-(--neutral-200) p-4 text-body-2-regular leading-6 text-muted-foreground flex flex-col gap-3">
                  <div>
                     <p className="font-semibold text-foreground mb-1">리셀(Resell) 거래 및 취소·환불 정책</p>
                     <p>본 서비스의 리셀(Resell) 기능은 이용자가 구매한 티켓을 다른 이용자에게 재판매할 수 있도록 제공되는 플랫폼 거래 서비스입니다. 리셀 거래는 이용자 간 거래를 기반으로 이루어지며, 아래 정책을 확인하고 동의한 경우에만 이용할 수 있습니다.</p>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">1. 리셀 서비스 이용 기준</p>
                     <p>리셀 서비스는 다음 조건을 충족하는 경우 이용할 수 있습니다.</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>GO-TI 플랫폼을 통해 예매가 완료된 티켓 중 아직 사용되지 않은 좌석</li>
                        <li>로그인 및 본인 인증 완료 이용자</li>
                        <li>플랫폼 정책에 따라 리셀 등록이 가능한 기간 내 티켓</li>
                     </ul>
                     <p className="mt-1">외부 플랫폼 또는 타 경로에서 구매한 티켓은 리셀 등록이 불가능합니다.</p>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">2. 리셀 등록 가능 시간</p>
                     <p>리셀 등록은 다음 기준에 따라 가능합니다.</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>예매 시작 +2시간 이후부터 등록 가능</li>
                        <li>경기 시작 1시간 전까지 등록 가능</li>
                     </ul>
                     <p className="mt-1">결제가 완료되지 않을 경우 좌석은 다시 리셀 가능 상태로 복구됩니다.</p>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">3. 리셀 가격 정책</p>
                     <p>리셀 가격은 이용자 간 거래를 통해 형성되는 시장 가격 방식으로 운영됩니다.</p>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">3.1 리셀 시작가</p>
                     <p>리셀 거래가 처음 시작되는 날에는 기준 데이터가 존재하지 않으므로 기존 티켓 판매 가격을 해당 경기의 리셀 시작가(금일 시작가)로 설정합니다.</p>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">3.2 가격 변동 기준</p>
                     <p>리셀 가격은 전일 마감가 기준 ±30% 범위 내에서 설정할 수 있습니다.</p>
                     <p>리셀 최소 가격은 별도의 고정 가격이 존재하지 않으며 전일 마감가 기준 가격 변동 범위에 따라 자동 결정됩니다.</p>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">4. 리셀 거래 방식</p>
                     <p>리셀 거래는 다음 절차로 진행됩니다.</p>
                     <ol className="list-decimal pl-5 flex flex-col gap-1">
                        <li>판매자가 리셀 판매 등록</li>
                        <li>구매자가 리셀 티켓 결제 진행</li>
                        <li>결제 완료 시 거래 확정</li>
                     </ol>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">5. 리셀 이용 제한 정책</p>
                     <p>공정한 거래 환경을 위해 다음과 같은 제한이 적용됩니다.</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>리셀 구매 티켓은 구매 후 6시간 동안 재판매가 제한됩니다.</li>
                        <li>동일 경기 티켓은 최대 3회까지 리셀 판매 등록이 가능합니다.</li>
                        <li>판매 등록 후 취소 또한 최대 3회까지 가능합니다.</li>
                        <li>동일 이용자의 일일 리셀 행위는 최대 10회로 제한될 수 있습니다.</li>
                        <li>반복적인 등록·취소 행위 등 비정상적인 거래 시도는 리셀 기능 이용이 제한될 수 있습니다.</li>
                     </ul>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">6. 리셀 거래 취소 및 환불 정책</p>
                     <p>리셀 거래는 이용자 간 거래 성격을 가지므로 원칙적으로 구매 후 단순 변심에 의한 취소 및 환불이 제한됩니다.</p>
                     <p className="mt-1">다만 다음의 경우 예외적으로 환불이 처리될 수 있습니다.</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>좌석 정보 오류</li>
                        <li>시스템 오류</li>
                        <li>플랫폼 또는 서비스 운영 책임이 인정되는 경우</li>
                     </ul>
                     <p className="mt-1">환불 책임 주체는 상황에 따라 플랫폼 또는 판매자로 구분될 수 있습니다.</p>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">7. 경기 취소 및 일정 변경 시 처리</p>
                     <p>경기 또는 이벤트 일정이 변경될 경우 다음 기준이 적용됩니다.</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>경기 취소 : 전액 환불</li>
                        <li>일정 변경 : 정책 기준에 따라 환불 가능 여부 결정</li>
                        <li>경기 중단 : 운영 정책에 따라 환불 또는 사용 처리</li>
                     </ul>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">8. 리셀 수수료 정책</p>
                     <p>리셀 거래가 완료될 경우 다음과 같은 수수료가 적용됩니다.</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>판매자 : 판매 금액 기준 5% 수수료</li>
                        <li>구매자 : 구매 금액 기준 5% 수수료</li>
                        <li>수수료에는 부가가치세(VAT)가 포함 되지 않습니다.</li>
                        <li>정책은 서비스 운영 정책에 따라 변경될 수 있습니다.</li>
                     </ul>
                  </div>
                  <div>
                     <p className="font-semibold text-foreground mb-1">9. 리셀 거래 책임</p>
                     <p>리셀 거래는 이용자 간 거래로 간주됩니다.</p>
                     <p>플랫폼은 거래 시스템을 제공하는 중개 플랫폼 역할을 수행하며</p>
                     <ul className="list-disc pl-5 flex flex-col gap-1">
                        <li>가격 변동</li>
                        <li>거래 실패</li>
                        <li>시장 가격 변화</li>
                     </ul>
                     <p className="mt-1">등 거래 과정에서 발생할 수 있는 위험은 이용자가 인지하고 이용해야 합니다.</p>
                     <p className="mt-2">리셀 서비스를 이용하기 위해서는 본 취소/환불 및 리셀 정책에 대한 동의가 필요합니다.</p>
                  </div>
               </div>
            </div>
            <DialogFooter className="p-5 pt-0 shrink-0">
               <Button type="button" variant="primary" className="h-12 w-full" onClick={onAgree}>
                  동의 후 닫기
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
interface TermsCardProps {
   agreedPrivacy: boolean;
   agreedPolicy: boolean;
   agreedResell: boolean;
   onChangePrivacy: (v: boolean) => void;
   onChangePolicy: (v: boolean) => void;
   onChangeResell: (v: boolean) => void;
}

export function TermsCard({
   agreedPrivacy,
   agreedPolicy,
   agreedResell,
   onChangePrivacy,
   onChangePolicy,
   onChangeResell,
}: TermsCardProps) {
   const [openModal, setOpenModal] = useState<'privacy' | 'policy' | 'resell' | null>(null);

   const terms = [
      {
         key: 'privacy' as const,
         label: '개인정보 수집 및 이용 동의',
         checked: agreedPrivacy,
         onChange: onChangePrivacy,
      },
      {
         key: 'policy' as const,
         label: '취소/환불 정책 동의',
         checked: agreedPolicy,
         onChange: onChangePolicy,
      },
      {
         key: 'resell' as const,
         label: '리셀 정책 동의',
         checked: agreedResell,
         onChange: onChangeResell,
      },
   ];

   return (
      <>
         <PaymentCard>
            <h3 className="text-heading-3-bold leading-normal text-foreground mb-5">약관 동의</h3>
            <div className="flex flex-col gap-4">
               {terms.map(term => (
                  <label key={term.key} className="flex items-center gap-3 cursor-pointer">
                     <Checkbox checked={term.checked} onCheckedChange={v => term.onChange(!!v)} />
                     <div className="flex items-center gap-1.5">
                        <span className="text-body-2-semibold leading-normal text-foreground">[필수]</span>
                        <button
                           type="button"
                           onClick={e => {
                              e.preventDefault();
                              setOpenModal(term.key);
                           }}
                           className="border-b border-foreground"
                        >
                           <span className="text-body-2-medium leading-normal text-foreground">{term.label}</span>
                        </button>
                     </div>
                  </label>
               ))}
            </div>
         </PaymentCard>

         <PrivacyDialog
            open={openModal === 'privacy'}
            onClose={() => setOpenModal(null)}
            onAgree={() => { onChangePrivacy(true); setOpenModal(null); }}
         />
         <PolicyDialog
            open={openModal === 'policy'}
            onClose={() => setOpenModal(null)}
            onAgree={() => { onChangePolicy(true); setOpenModal(null); }}
         />
         <ResellPolicyDialog
            open={openModal === 'resell'}
            onClose={() => setOpenModal(null)}
            onAgree={() => { onChangeResell(true); setOpenModal(null); }}
         />
      </>
   );
}
