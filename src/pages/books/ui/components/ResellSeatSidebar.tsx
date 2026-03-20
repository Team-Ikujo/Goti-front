import type { ApexOptions } from 'apexcharts';
import { useMemo, useState } from 'react';
import Chart from 'react-apexcharts';

import { Button } from '@/shared/ui/button';
import { formatPrice } from '@/pages/books/model/zoneData';
import type { ZoneItem } from '@/pages/books/model/types';
import type { ResellListingItem, ResellTradeRange, ResellZoneInsights } from '@/pages/books/model/resellData';
import { cn } from '@/shared/lib/utils';

type ResellSeatSidebarProps = {
   insights: ResellZoneInsights;
   selectedListingId?: string;
   zone: ZoneItem;
   zoneOverviewImage: string;
   stadiumName: string;
   onSelectListing: (listing: ResellListingItem) => void;
   onSubmit: () => void;
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

function ResellSeatSidebar({
   insights,
   selectedListingId,
   zone,
   zoneOverviewImage,
   stadiumName,
   onSelectListing,
   onSubmit,
}: ResellSeatSidebarProps) {
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
   const yAxisMin = useMemo(() => {
      return Math.max(0, Math.floor(chartMin / yAxisStep) * yAxisStep);
   }, [chartMin, yAxisStep]);
   const yAxisMax = useMemo(() => {
      const nextMax = Math.ceil(chartMax / yAxisStep) * yAxisStep;

      return nextMax === yAxisMin ? nextMax + yAxisStep : nextMax;
   }, [chartMax, yAxisMin, yAxisStep]);
   const chartOptions = useMemo<ApexOptions>(
      () => ({
         chart: {
            type: 'area',
            height: 200,
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
               colorStops: [
                  [
                     { offset: 0, color: '#2563eb', opacity: 0.2 },
                     { offset: 100, color: '#2563eb', opacity: 0 },
                  ],
               ],
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
               right: 10,
               bottom: 0,
               left: 4,
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
               style: {
                  colors: Array.from({ length: pricePoints.length }, () => '#8a94a6'),
                  fontSize: '12px',
                  fontWeight: 400,
               },
            },
         },
         states: {
            hover: {
               filter: {
                  type: 'none',
               },
            },
            active: {
               filter: {
                  type: 'none',
               },
            },
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
               minWidth: 44,
               maxWidth: 44,
               align: 'left',
               offsetX: 6,
               style: {
                  colors: ['#8a94a6'],
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
      <aside className="flex w-full shrink-0 flex-col border-l border-border-light bg-background xl:w-[420px]">
         <div className="relative h-[220px] overflow-hidden border-b border-border-light bg-[#e9ebee] px-5 py-2.5">
            <div className="relative mx-auto h-[200px] w-[200px] shrink-0">
               <img
                  src={zoneOverviewImage}
                  alt={`${stadiumName} ${zone.name} 구역 좌석도`}
                  className="h-full w-full object-contain opacity-70"
                  draggable={false}
               />
            </div>
         </div>

         <div className="flex flex-1 flex-col gap-12 overflow-y-auto pb-5">
            <section className="space-y-6">
               <div className="flex items-center gap-1 px-5 pt-5">
                  <h2 className="text-heading-3-bold text-foreground">거래 변동</h2>
                  <span className={cn('text-label-2-semibold', insights.changeAmount >= 0 ? 'text-destructive' : 'text-primary')}>
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
                  <div className="rounded-[8px] border border-border-light bg-background px-0 py-3">
                     <div role="img" aria-label={`${zone.name} 리셀 가격 추이`}>
                        <div className="pr-2">
                           <Chart options={chartOptions} series={chartOptions.series ?? []} type="area" height={200} />
                        </div>
                     </div>
                  </div>
               </div>
            </section>

            <section className="space-y-4">
               <div className="px-5">
                  <h3 className="text-heading-3-bold text-foreground">최근 거래 내역</h3>
               </div>
               <ul className="space-y-1 px-5">
                  {insights.tradeHistory.map((item) => (
                     <li key={item.id} className="grid grid-cols-[max-content_minmax(0,1fr)_88px] items-center gap-x-3 text-body-2-regular text-secondary">
                        <span className="whitespace-nowrap text-body-2-semibold">{formatPrice(item.price)}</span>
                        <span className="min-w-0 truncate text-right">{item.seatLabel}</span>
                        <span className="whitespace-nowrap text-right text-caption-1-regular text-tertiary">{item.tradedAt}</span>
                     </li>
                  ))}
               </ul>
            </section>

            <section className="space-y-3">
               <div className="flex items-center gap-1 px-5">
                  <h3 className="text-heading-3-bold text-foreground">판매 중인 좌석</h3>
                  <span className="text-heading-3-bold text-primary">{insights.listings.length}</span>
               </div>

               <ul className="space-y-3 px-5">
                  {insights.listings.map((item) => {
                     const isSelected = item.listingId === selectedListingId;

                     return (
                        <li key={item.listingId}>
                           <button
                              type="button"
                              onClick={() => onSelectListing(item)}
                              className={cn(
                                 'flex w-full items-start gap-6 rounded-[12px] border px-4 py-4 text-left transition-colors',
                                 isSelected ? 'border-primary bg-primary/5' : 'border-border-light bg-background hover:border-primary/40',
                              )}
                              aria-pressed={isSelected}
                           >
                              <span className="flex-1 text-body-1-semibold text-secondary">{item.seatLabel}</span>
                              <span className="shrink-0 text-body-1-bold text-secondary">{formatPrice(item.listingPrice)}</span>
                           </button>
                        </li>
                     );
                  })}
               </ul>
            </section>
         </div>

         <div className="px-5 pb-5">
            <Button
               type="button"
               disabled={!selectedListingId}
               className="h-12 w-full rounded-[8px]"
               onClick={onSubmit}
            >
               예매하기
            </Button>
         </div>
      </aside>
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

export default ResellSeatSidebar;
