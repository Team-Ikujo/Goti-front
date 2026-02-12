import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  useTermDetailQuery,
  useTermsAgreementListQuery,
} from "@/entities/terms/model/useTermsQueries";
import type { TermCode } from "@/entities/terms/model/types";

const VerificationFlowPage = () => {
  const navigate = useNavigate();
  const termsAgreementListQuery = useTermsAgreementListQuery();
  const agreements = termsAgreementListQuery.data ?? [];
  const [checkedByCode, setCheckedByCode] = useState<
    Partial<Record<TermCode, boolean>>
  >({});

  const [detailTargetCode, setDetailTargetCode] = useState<TermCode | null>(
    null,
  );
  const termDetailQuery = useTermDetailQuery(detailTargetCode);
  const [detailTriggerElement, setDetailTriggerElement] =
    useState<HTMLElement | null>(null);

  const areRequiredTermsChecked = useMemo(() => {
    return agreements.every((agreement) => {
      if (!agreement.required) {
        return true;
      }
      return checkedByCode[agreement.code] === true;
    });
  }, [agreements, checkedByCode]);

  const isAllChecked = useMemo(() => {
    return (
      agreements.length > 0 &&
      agreements.every((agreement) => checkedByCode[agreement.code] === true)
    );
  }, [agreements, checkedByCode]);

  const handleAllCheckedChange = (checked: boolean | "indeterminate") => {
    const nextValue = checked === true;
    const nextState: Partial<Record<TermCode, boolean>> = {};
    agreements.forEach((agreement) => {
      nextState[agreement.code] = nextValue;
    });
    setCheckedByCode(nextState);
  };

  const handleProceedToSignup = () => {
    if (!areRequiredTermsChecked) {
      return;
    }
    navigate("/auth/signup");
  };

  const closeDetailDialog = () => {
    setDetailTargetCode(null);
    requestAnimationFrame(() => {
      detailTriggerElement?.focus();
    });
  };

  const handleOpenDetail = (code: TermCode, trigger: HTMLElement) => {
    setDetailTriggerElement(trigger);
    setDetailTargetCode(code);
  };

  const handleAgreeAndClose = () => {
    if (detailTargetCode) {
      setCheckedByCode((prev) => ({ ...prev, [detailTargetCode]: true }));
    }
    closeDetailDialog();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen w-full max-w-300 px-5">
        <section className="mx-auto flex w-full max-w-95 flex-1 flex-col pt-20">
          <h1 className="pb-10 text-center text-heading-1-bold text-foreground">
            약관에 동의하고
            <br />
            본인 인증을 진행해 주세요
          </h1>

          <div className="space-y-1">
            <label className="flex items-center gap-2 rounded-lg bg-(--neutral-50) px-4 py-3">
              <Checkbox
                checked={isAllChecked}
                onCheckedChange={handleAllCheckedChange}
                size="lg"
              />
              <span className="text-body-1-medium text-foreground">
                전체동의
              </span>
            </label>

            <div>
              {agreements.map((agreement) => (
                <div
                  key={agreement.code}
                  className="flex items-center gap-1 rounded-lg"
                >
                  <label className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5">
                    <Checkbox
                      size="md"
                      checked={Boolean(checkedByCode[agreement.code])}
                      onCheckedChange={(checked) =>
                        setCheckedByCode((prev) => ({
                          ...prev,
                          [agreement.code]: checked === true,
                        }))
                      }
                    />
                    <span className="text-body-2-medium text-muted-foreground">
                      {agreement.label}
                    </span>
                  </label>
                  {agreement.hasDetail ? (
                    <Button
                      type="button"
                      variant="none"
                      size="sm"
                      aria-label={`${agreement.label} 상세 보기`}
                      className="h-8 w-8 shrink-0 p-0 text-muted-foreground"
                      onClick={(event) =>
                        handleOpenDetail(agreement.code, event.currentTarget)
                      }
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-auto w-full max-w-93.75 px-5 pb-5">
            <Button
              type="button"
              className="w-full"
              disabled={!areRequiredTermsChecked}
              onClick={handleProceedToSignup}
            >
              본인 인증하기
            </Button>
          </div>
        </section>
      </main>

      <Dialog
        open={Boolean(detailTargetCode)}
        onOpenChange={(open) => {
          if (!open) {
            closeDetailDialog();
          }
        }}
      >
        <DialogContent
          maxWidth={588}
          className="w-[calc(100%-40px)] gap-0 rounded-xl border-0 bg-elevated p-0 shadow-xl"
        >
          {termDetailQuery.isLoading ? (
            <div className="p-10 text-center text-body-2-regular text-muted-foreground">
              약관 내용을 불러오는 중입니다.
            </div>
          ) : termDetailQuery.data ? (
            <>
              <DialogHeader className="px-5 py-5">
                <DialogTitle align="center" className="text-heading-4-bold">
                  {termDetailQuery.data.title}
                </DialogTitle>
              </DialogHeader>

              <div className="px-5 pb-5">
                <div className="rounded-lg border border-(--neutral-200) p-4">
                  <DialogDescription className="text-body-2-regular leading-6 text-muted-foreground">
                    {termDetailQuery.data.summary}
                    <br />
                    <br />
                    {termDetailQuery.data.scopeTitle}
                  </DialogDescription>

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

                  <DialogDescription className="mt-4 text-body-2-regular leading-6 text-muted-foreground">
                    {termDetailQuery.data.footerNote}
                  </DialogDescription>
                </div>
              </div>

              <div className="px-5 pb-5">
                <DialogClose asChild>
                  <Button
                    type="button"
                    className="h-12 w-full"
                    onClick={handleAgreeAndClose}
                  >
                    동의 후 닫기
                  </Button>
                </DialogClose>
              </div>
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
