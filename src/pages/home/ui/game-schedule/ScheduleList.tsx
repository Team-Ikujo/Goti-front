import { useMemo, useState } from 'react';
import { TicketX } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';

import BookingCaptchaDialog from './BookingCaptchaDialog';
import BookingGuideDialog from './BookingGuideDialog';
import { TAB_TODAY, TODAY, statusColor, teamLogos } from './constants';
import type { DaySchedule, GameRow } from './types';
import { getGameResultTexts } from './utils';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createMockCaptcha(length = 6): string {
  return Array.from({ length }, () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]).join('');
}

function ScoreDisplay({ game }: { game: GameRow }) {
  const scoreText = game.score ?? 'VS';

  if (game.status === '종료' && game.score) {
    const [awayScore, homeScore] = game.score.split(':').map(Number);
    const awayLost = awayScore < homeScore;

    return (
      <span className="text-[24px] font-bold text-center leading-[1.5] whitespace-nowrap text-[#ef4444]">
        <span className={awayLost ? 'text-[#acb4bb]' : ''}>{awayScore}:</span>
        <span className={!awayLost ? 'text-[#acb4bb]' : ''}>{homeScore}</span>
      </span>
    );
  }

  return <span className="text-[24px] font-bold text-(--text-primary) text-center leading-[1.5] whitespace-nowrap">{scoreText}</span>;
}

function MobileScoreDisplay({ game }: { game: GameRow }) {
  const scoreText = game.score ?? 'VS';

  if (game.status === '종료' && game.score) {
    const [awayScore, homeScore] = game.score.split(':').map(Number);
    const awayLost = awayScore < homeScore;

    return (
      <span className="text-[20px] font-bold text-center leading-[1.5] whitespace-nowrap text-[#ef4444]">
        <span className={awayLost ? 'text-[#acb4bb]' : ''}>{awayScore}:</span>
        <span className={!awayLost ? 'text-[#acb4bb]' : ''}>{homeScore}</span>
      </span>
    );
  }

  return <span className="text-[20px] font-bold text-(--text-primary) text-center leading-[1.5] whitespace-nowrap">{scoreText}</span>;
}

function EmptyState() {
  return (
    <div className="bg-[#f7f8f9] flex h-[400px] items-center justify-center overflow-hidden px-5 py-[100px] rounded-[10px] w-full">
      <div className="flex flex-col gap-[10px] items-center justify-center">
        <TicketX className="size-[75px] text-[#acb4bb]" strokeWidth={1.2} />
        <p className="text-[22px] font-semibold text-[#646f7c] text-center leading-[1.55]">현재 예매 가능한 경기가 없습니다.</p>
      </div>
    </div>
  );
}

function TeamName({
  name,
  isEnded,
  result,
  textDisabled,
}: {
  name: string;
  isEnded: boolean;
  result: string;
  textDisabled: string;
}) {
  if (isEnded) {
    return (
      <div className="flex flex-col items-center shrink-0">
        <span className={cn('text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap', textDisabled)}>{name}</span>
        <span className="text-[12px] font-medium text-(--text-tertiary) leading-[1.5]">{result}</span>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center shrink-0">
      <span className="text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap text-(--text-primary)">{name}</span>
    </div>
  );
}

function MobileTeam({
  name,
  isEnded,
  result,
  isHome,
}: {
  name: string;
  isEnded: boolean;
  result: string;
  isHome: boolean;
}) {
  const textClass = isEnded ? 'text-[#acb4bb]' : 'text-(--text-primary)';

  if (isHome) {
    return (
      <div className="flex items-center gap-[8px] shrink-0">
        {isEnded && <span className="text-[12px] font-normal text-[#acb4bb] leading-[1.5]">{result}</span>}
        <span className={cn('text-[16px] font-semibold text-center leading-[1.5] whitespace-nowrap', textClass)}>{name}</span>
        <div className="relative size-[48px] shrink-0">
          <img src={teamLogos[name]} alt={name} className={cn('size-full object-contain', isEnded && 'opacity-50')} />
          <div className="absolute bg-[#acb4bb] bottom-0 right-0 h-[15px] rounded-[4px] w-[17px] flex items-center justify-center">
            <span className="text-white text-[10px] leading-[1.5]">홈</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[8px] shrink-0">
      <img src={teamLogos[name]} alt={name} className={cn('size-[48px] object-contain shrink-0', isEnded && 'opacity-50')} />
      <span className={cn('text-[16px] font-semibold text-center leading-[1.5] whitespace-nowrap', textClass)}>{name}</span>
      {isEnded && <span className="text-[12px] font-normal text-[#acb4bb] leading-[1.5]">{result}</span>}
    </div>
  );
}

function ActionButtons({
  game,
  isEnded,
  onOpenBookingFlow,
}: {
  game: GameRow;
  isEnded: boolean;
  onOpenBookingFlow: (game: GameRow) => void;
}) {
  const canBook = game.ticket === '예매하기';

  return (
    <>
      {!isEnded && (
        <div className="flex md:hidden gap-[8px] h-[38px] items-center w-full">
          <button
            type="button"
            disabled={!canBook}
            onClick={() => onOpenBookingFlow(game)}
            className={cn(
              'h-full flex-1 px-[16px] py-[8px] rounded-[8px] text-[14px] font-medium leading-[1.5] text-white',
              canBook ? 'bg-primary' : 'bg-[#acb4bb]',
            )}
          >
            {game.ticket}
          </button>
          <button
            type="button"
            className={cn(
              'h-full flex-1 px-[16px] py-[8px] rounded-[8px] text-[14px] font-medium leading-[1.5] border',
              game.resell === '리셀예매'
                ? 'bg-background border-primary text-primary'
                : 'bg-background border-[#acb4bb] text-[#acb4bb]',
            )}
          >
            {game.resell}
          </button>
        </div>
      )}

      <div className={cn('hidden md:flex gap-[10px] h-[66px] items-center shrink-0', isEnded && 'opacity-0')}>
        <button
          type="button"
          disabled={!canBook}
          onClick={() => onOpenBookingFlow(game)}
          className={cn(
            'h-full px-[16px] py-[8px] rounded-[6px] text-[16px] font-medium leading-[1.5] text-white',
            canBook ? 'bg-primary' : 'bg-[#acb4bb] w-[88px]',
          )}
        >
          {game.ticket}
        </button>
        <button
          type="button"
          className={cn(
            'h-full px-[16px] py-[8px] rounded-[6px] text-[16px] font-medium leading-[1.5] border',
            game.resell === '리셀예매'
              ? 'bg-background border-primary text-primary'
              : 'bg-background border-[#acb4bb] text-[#acb4bb] w-[88px] whitespace-nowrap',
          )}
        >
          {game.resell}
        </button>
      </div>
    </>
  );
}

function MobileGameRow({
  day,
  game,
  index,
  onOpenBookingFlow,
}: {
  day: DaySchedule;
  game: GameRow;
  index: number;
  onOpenBookingFlow: (game: GameRow) => void;
}) {
  const isLast = index === day.games.length - 1;
  const isEnded = game.status === '종료';
  const textDisabled = isEnded ? 'text-[#acb4bb]' : 'text-(--text-primary)';
  const resultText = getGameResultTexts(game.score, isEnded);

  return (
    <div
      className={cn(
        'md:hidden border border-t-0 border-(--border-normal) px-[17px] pt-[16px] pb-[16px] flex flex-col gap-[12px]',
        isLast && 'rounded-bl-[16px] rounded-br-[16px]',
        isEnded ? 'bg-[#f7f8f9]' : 'bg-background',
      )}
    >
      <div className="flex items-center gap-[12px]">
        <span className={cn('text-[14px] font-semibold leading-[1.5] whitespace-nowrap', textDisabled)}>{game.time}</span>
        <span className="text-[14px] leading-[1.5] whitespace-nowrap text-[#acb4bb]">|</span>
        <span className={cn('text-[14px] font-semibold leading-[1.5] whitespace-nowrap', textDisabled)}>{game.venue}</span>
      </div>

      <div className="flex items-center justify-between">
        <MobileTeam name={game.away} isEnded={isEnded} result={resultText.away} isHome={false} />

        <div className="flex flex-col items-center justify-center shrink-0">
          <MobileScoreDisplay game={game} />
          <span className={cn('text-[12px] font-medium text-center leading-[1.5]', statusColor[game.status])}>{game.status}</span>
        </div>

        <MobileTeam name={game.home} isEnded={isEnded} result={resultText.home} isHome={true} />
      </div>

      <ActionButtons game={game} isEnded={isEnded} onOpenBookingFlow={onOpenBookingFlow} />
    </div>
  );
}

function DesktopGameRow({
  day,
  game,
  index,
  onOpenBookingFlow,
}: {
  day: DaySchedule;
  game: GameRow;
  index: number;
  onOpenBookingFlow: (game: GameRow) => void;
}) {
  const isLast = index === day.games.length - 1;
  const isEnded = game.status === '종료';
  const textDisabled = isEnded ? 'text-[#acb4bb]' : 'text-(--text-primary)';
  const resultText = getGameResultTexts(game.score, isEnded);

  return (
    <div
      className={cn(
        'hidden md:flex border border-t-0 border-(--border-normal) px-[20px] py-[6px] items-center justify-between',
        isLast && 'rounded-bl-[20px] rounded-br-[20px]',
        isEnded ? 'bg-[#f7f8f9]' : 'bg-background',
      )}
    >
      <div className="flex gap-[30px] items-center shrink-0">
        <div className="flex items-center justify-center w-[60px]">
          <span className={cn('text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap', textDisabled)}>{game.time}</span>
        </div>
        <div className="flex items-center justify-center w-[40px]">
          <span className={cn('text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap', textDisabled)}>{game.venue}</span>
        </div>
      </div>

      <div className="flex gap-[50px] items-center shrink-0">
        <div className="flex items-center justify-center w-[150px]">
          <div className="flex h-[75px] items-center justify-end w-[70px] shrink-0">
            <div className="w-[30px] h-[75px] shrink-0" />
            <TeamName name={game.away} isEnded={isEnded} result={resultText.away} textDisabled={textDisabled} />
          </div>
          <div className="flex flex-col items-center justify-center overflow-hidden px-[15px] py-[10px] size-[75px] shrink-0">
            <img src={teamLogos[game.away]} alt={game.away} className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-[40px] shrink-0">
          <ScoreDisplay game={game} />
          <span className={cn('text-[12px] font-medium text-center leading-[1.5]', statusColor[game.status])}>{game.status}</span>
        </div>

        <div className="flex items-center justify-center w-[150px]">
          <div className="flex flex-col items-center justify-center overflow-hidden px-[15px] py-[10px] size-[75px] shrink-0">
            <img src={teamLogos[game.home]} alt={game.home} className="w-full h-full object-contain" />
          </div>
          <div className="flex h-[75px] items-center justify-between w-[70px] shrink-0">
            <TeamName name={game.home} isEnded={isEnded} result={resultText.home} textDisabled={textDisabled} />
            <div className="flex h-[75px] items-center justify-end w-[30px] shrink-0">
              <div className="bg-[#acb4bb] flex flex-col items-center justify-center px-[4px] rounded-[2px] w-[22px]">
                <span className="text-white text-[16px] font-medium text-center leading-[1.5]">홈</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActionButtons game={game} isEnded={isEnded} onOpenBookingFlow={onOpenBookingFlow} />
    </div>
  );
}

type ScheduleListProps = {
  activeTab: number;
  filteredData: DaySchedule[];
};

function ScheduleList({ activeTab, filteredData }: ScheduleListProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaSeed, setCaptchaSeed] = useState(0);

  const captchaCode = useMemo(() => createMockCaptcha(), [captchaSeed]);

  const openBookingFlow = (game: GameRow) => {
    if (game.ticket !== '예매하기') {
      return;
    }

    setIsGuideOpen(true);
  };

  const confirmGuideAndOpenCaptcha = () => {
    setIsGuideOpen(false);
    setCaptchaInput('');
    setCaptchaError('');
    setCaptchaSeed((prev) => prev + 1);
    setIsCaptchaOpen(true);
  };

  const refreshCaptcha = () => {
    setCaptchaSeed((prev) => prev + 1);
    setCaptchaError('');
  };

  const submitCaptcha = () => {
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setCaptchaError('보안 문자가 일치하지 않습니다. 다시 확인해 주세요.');
      return;
    }

    setIsCaptchaOpen(false);
    setCaptchaInput('');
    setCaptchaError('');
  };

  if (filteredData.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={cn('flex flex-col', activeTab !== TAB_TODAY && 'gap-[25px]')}>
      {filteredData.map((day) => {
        const isToday = day.isToday ?? day.date === TODAY;

        return (
          <div key={day.date}>
            <div className="bg-[#f1f2f4] border border-(--border-normal) h-[46px] md:h-auto px-[25px] md:px-[30px] py-[10px] rounded-tl-[16px] rounded-tr-[16px] md:rounded-tl-[20px] md:rounded-tr-[20px] flex items-center justify-center md:justify-start gap-2">
              <span className="text-[16px] md:text-[length:var(--typo---heading\/h4,20px)] font-semibold text-(--text-primary) leading-[1.5]">{day.date}</span>
              {isToday && <Badge variant="chipDestructive">오늘</Badge>}
            </div>

            {day.games.map((game, index) => (
              <div key={`${day.date}-${game.time}-${game.away}-${game.home}-${index}`}>
                <MobileGameRow day={day} game={game} index={index} onOpenBookingFlow={openBookingFlow} />
                <DesktopGameRow day={day} game={game} index={index} onOpenBookingFlow={openBookingFlow} />
              </div>
            ))}
          </div>
        );
      })}

      <BookingGuideDialog open={isGuideOpen} onOpenChange={setIsGuideOpen} onConfirm={confirmGuideAndOpenCaptcha} />

      <BookingCaptchaDialog
        open={isCaptchaOpen}
        captchaCode={captchaCode}
        value={captchaInput}
        error={captchaError}
        onOpenChange={(open) => {
          setIsCaptchaOpen(open);
          if (!open) {
            setCaptchaInput('');
            setCaptchaError('');
          }
        }}
        onChangeValue={(value) => {
          setCaptchaInput(value);
          if (captchaError) {
            setCaptchaError('');
          }
        }}
        onRefresh={refreshCaptcha}
        onSubmit={submitCaptcha}
      />
    </div>
  );
}

export default ScheduleList;
