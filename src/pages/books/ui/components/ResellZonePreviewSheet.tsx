import type { ApexOptions } from 'apexcharts';
import { useMemo, useState } from 'react';
import Chart from 'react-apexcharts';

import { formatPrice } from '@/pages/books/model/zoneData';
import type { ResellListingItem, ResellTradeRange, ResellZoneInsights } from '@/pages/books/model/resellData';
import type { ZoneItem } from '@/pages/books/model/types';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

type ResellZonePreviewSheetProps = {
   insights: ResellZoneInsights;
   zone: ZoneItem;
   selectedListingId?: string;
   onSelectListing?: (listing: ResellListingItem) => void;
   submitLabel?: string;
   submitDisabled?: boolean;
   onSubmit?: () => void;
};

const tooltipWeekdayFormatter = new Intl.DateTimeFormat('ko-KR', {
   weekday: 'short',
   timeZone: 'Asia/Seoul',
});

const tooltipDateFormatter = new Intl.DateTimeFormat('sv-SE', {
   year: 'numeric',
   month: '2-digit',
   day: '2-digit',
   hour: '2-digit',
   minute: '2-digit',
   hour12: false,
   timeZone: 'Asia/Seoul',
});

const formatTooltipTimestamp = (occurredAt: string) => {
   const date = new Date(occurredAt);

   return `${tooltipWeekdayFormatter.format(date)}, ${tooltipDateFormatter.format(date).replace(' ', ', ')}`;
};

const formatTooltipChangeRate = (price: number, previousClose: number) => {
   if (previousClose <= 0) {
      return '0.00%';
   }

   const changeRate = ((price - previousClose) / previousClose) * 100;

   return `${changeRate >= 0 ? '+' : ''}${changeRate.toFixed(2)}%`;
};

function ResellZonePreviewSheet({
   insights,
   zone,
   selectedListingId,
   onSelectListing,
   submitLabel,
   submitDisabled,
   onSubmit,
}: ResellZonePreviewSheetProps) {
   const [chartRange, setChartRange] = useState<ResellTradeRange>('minute');
   const pricePoints = insights.pricePointsByRange[chartRange];
   const priceValues = useMemo(() => pricePoints.map((point) => point.price), [pricePoints]);
   const chartMin = Math.min(...priceValues);
   const chartMax = Math.max(...priceValues);
   const yAxisStep = useMemo(() => {
      const range = Math.max(1, chartMax - chartMin);
      const roughStep = range / 4;

      return Math.max(1000, Math.ceil(roughStep / 1000) * 1000);
   }, [chartMax, chartMin]);
   const yAxisMin = useMemo(() => Math.max(0, Math.floor(chartMin / yAxisStep) * yAxisStep), [chartMin, yAxisStep]);
   const yAxisMax = useMemo(() => {
      const nextMax = Math.ceil(chartMax / yAxisStep) * yAxisStep;

      return nextMax === yAxisMin ? nextMax + yAxisStep : nextMax;
   }, [chartMax, yAxisMin, yAxisStep]);
   const chartOptions = useMemo<ApexOptions>(
      () => ({
         chart: {
            type: 'area',
            height: 179,
            toolbar: { show: false },
            zoom: { enabled: false },
            sparkline: { enabled: false },
            animations: { enabled: false },
            fontFamily: 'inherit',
            parentHeightOffset: 0,
         },
         series: [
            {
               name: '리셀 가격',
               data: pricePoints.map((point) => point.price),
            },
         ],
         colors: ['#2563eb'],
         fill: {
            type: 'gradient',
            gradient: {
               shade: 'light',
               type: 'vertical',
               shadeIntensity: 0,
               inverseColors: false,
               opacityFrom: 0.2,
               opacityTo: 0,
               stops: [0, 100],
               colorStops: [[
                  { offset: 0, color: '#2563eb', opacity: 0.2 },
                  { offset: 100, color: '#2563eb', opacity: 0 },
               ]],
            },
         },
         stroke: {
            curve: 'straight',
            width: 3,
            lineCap: 'round',
         },
         markers: {
            size: 4,
            colors: ['#ffffff'],
            strokeColors: '#2563eb',
            strokeWidth: 2,
            hover: { sizeOffset: 1 },
         },
         dataLabels: { enabled: false },
         tooltip: {
            enabled: true,
            theme: 'dark',
            x: { show: false },
            y: { formatter: undefined, title: { formatter: () => '' } },
            marker: { show: false },
            custom: ({ dataPointIndex }) => {
               const point = pricePoints[dataPointIndex];

               if (!point) {
                  return '';
               }

               return `
                  <div style="border-radius:8px;background:#161d24;padding:4px 8px;color:#ffffff;font-size:12px;font-weight:700;line-height:1.5;">
                     <div>체결 가격: ${point.price.toLocaleString('ko-KR')}(${formatTooltipChangeRate(point.price, insights.previousClose)})</div>
                     <div>${formatTooltipTimestamp(point.occurredAt)}</div>
                  </div>
               `;
            },
         },
         legend: { show: false },
         grid: {
            borderColor: '#d9dde3',
            strokeDashArray: 4,
            padding: {
               top: 8,
               right: 18,
               bottom: -2,
               left: 12,
            },
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
         },
         xaxis: {
            categories: pricePoints.map((point) => point.time),
            axisBorder: { show: false },
            axisTicks: { show: false },
            crosshairs: { show: false },
            tooltip: { enabled: false },
            labels: {
               offsetX: 4,
               style: {
                  colors: Array.from({ length: pricePoints.length }, () => '#646f7c'),
                  fontSize: '12px',
                  fontWeight: 400,
               },
            },
         },
         states: {
            hover: { filter: { type: 'none' } },
            active: { filter: { type: 'none' } },
         },
         yaxis: {
            show: true,
            min: yAxisMin,
            max: yAxisMax,
            tickAmount: Math.max(1, Math.round((yAxisMax - yAxisMin) / yAxisStep)),
            stepSize: yAxisStep,
            opposite: true,
            decimalsInFloat: 0,
            forceNiceScale: false,
            labels: {
               show: true,
               minWidth: 52,
               maxWidth: 52,
               align: 'left',
               offsetX: 6,
               style: {
                  colors: ['#646f7c'],
                  fontSize: '12px',
                  fontWeight: 400,
               },
               formatter: (value) => value.toLocaleString('ko-KR'),
            },
         },
      }),
      [insights.previousClose, pricePoints, yAxisMax, yAxisMin, yAxisStep],
   );

   return (
      <div className="flex h-full flex-col overflow-y-auto pb-8">
         <section className="space-y-5">
            <div className="flex items-center gap-1 px-5 pt-5">
               <h2 className="text-heading-3-bold text-foreground">거래 변동</h2>
               <span className={cn('text-label-1-semibold', insights.changeAmount >= 0 ? 'text-destructive' : 'text-primary')}>
                  {insights.changeAmount >= 0 ? '+' : ''}
                  {formatPrice(insights.changeAmount)} ({insights.changeRate}%)
               </span>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-1 px-5 text-caption-1-medium text-tertiary">
               <Metric label="전일 종가" value={formatPrice(insights.previousClose)} />
               <Metric label="최근 거래 체결가" value={formatPrice(insights.recentTrade)} />
               <Metric label="금일 하한가" value={formatPrice(insights.dayLow)} valueClassName="text-primary" />
               <Metric label="금일 상한가" value={formatPrice(insights.dayHigh)} valueClassName="text-destructive" />
            </div>

            <div className="px-5">
               <div className="flex rounded-[12px] bg-[#f1f2f4] p-1">
                  {([
                     { key: 'minute', label: '1분' },
                     { key: 'day', label: '1일' },
                  ] as const).map((item) => (
                     <button
                        key={item.key}
                        type="button"
                        onClick={() => setChartRange(item.key)}
                        className={cn(
                           'flex-1 rounded-[8px] px-2.5 py-2 text-body-2-bold transition-colors',
                           chartRange === item.key ? 'bg-background text-secondary' : 'text-disabled-foreground',
                        )}
                     >
                        {item.label}
                     </button>
                  ))}
               </div>
            </div>

            <div className="px-5">
               <div className="rounded-[8px] bg-background py-2">
                  <div role="img" aria-label={`${zone.name} 리셀 가격 추이`}>
                     <div className="pr-1">
                        <Chart options={chartOptions} series={chartOptions.series ?? []} type="area" height={179} />
                     </div>
                  </div>
               </div>
            </div>
         </section>

         <section className="space-y-4 pt-12">
            <div className="px-5">
               <h3 className="text-heading-3-bold text-foreground">최근 거래 내역</h3>
            </div>
            <ul className="space-y-1 px-5">
               {insights.tradeHistory.map((item) => (
                  <li key={item.id} className="grid grid-cols-[max-content_minmax(0,1fr)_66px] items-center gap-x-3 text-body-2-regular text-secondary">
                     <span className="whitespace-nowrap text-body-1-semibold">{formatPrice(item.price)}</span>
                     <span className="min-w-0 truncate text-right">{item.seatLabel}</span>
                     <span className="whitespace-nowrap text-right text-caption-1-regular text-tertiary">{item.tradedAt}</span>
                  </li>
               ))}
            </ul>
         </section>

         <section className="space-y-3 pt-12">
            <div className="flex items-center gap-1 px-5">
               <h3 className="text-heading-3-bold text-foreground">판매 중인 좌석</h3>
               <span className="text-heading-3-bold text-primary">{insights.listings.length}</span>
            </div>

            <ul className="space-y-3 px-5">
               {insights.listings.map((item) => {
                  const isSelected = item.listingId === selectedListingId;

                  if (onSelectListing) {
                     return (
                        <li key={item.listingId}>
                           <button
                              type="button"
                              onClick={() => onSelectListing(item)}
                              className={cn(
                                 'flex w-full items-start justify-between gap-4 rounded-[12px] bg-background px-4 py-4 text-left transition-colors',
                                 isSelected ? 'border-2 border-primary' : 'border border-border-light',
                              )}
                           >
                              <span className="text-body-1-semibold text-secondary">{item.seatLabel}</span>
                              <span className={cn('shrink-0 text-body-1-bold', isSelected ? 'text-primary' : 'text-secondary')}>
                                 {formatPrice(item.listingPrice)}
                              </span>
                           </button>
                        </li>
                     );
                  }

                  return (
                     <li key={item.listingId} className="flex w-full items-start gap-6 rounded-[12px] border border-border-light bg-background px-4 py-4">
                        <span className="flex-1 text-body-1-semibold text-secondary">{item.seatLabel}</span>
                        <span className="shrink-0 text-body-1-bold text-secondary">{formatPrice(item.listingPrice)}</span>
                     </li>
                  );
               })}
            </ul>
         </section>

         {submitLabel && onSubmit ? (
            <div className="px-5 pt-5">
               <Button
                  type="button"
                  disabled={submitDisabled}
                  className="h-12 w-full rounded-[8px]"
                  onClick={onSubmit}
               >
                  {submitLabel}
               </Button>
            </div>
         ) : null}
      </div>
   );
}

function Metric({
   label,
   value,
   valueClassName,
}: {
   label: string;
   value: string;
   valueClassName?: string;
}) {
   return (
      <div className="flex min-w-0 items-center gap-2">
         <span className="flex-1">{label}</span>
         <span className={cn('shrink-0 text-caption-1-bold text-tertiary', valueClassName)}>{value}</span>
      </div>
   );
}

export default ResellZonePreviewSheet;
