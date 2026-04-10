// src/pages/books/ui/components/ResellPriceChart.tsx

import type { ApexOptions } from 'apexcharts';
import { useMemo, useState } from 'react';
import Chart from 'react-apexcharts';

import { formatPrice } from '@/pages/books/model/zoneData';
import type { ResellTradeRange, ResellZoneInsights } from '@/pages/books/model/resellData';
import { cn } from '@/shared/lib/utils';

interface Props {
   insights: ResellZoneInsights;
   zoneName?: string;
   height?: number;
   /** dialog: 3열 카드 (ResellRegisterDialog) | sidebar: 4개 2열 인라인 (ResellSeatSidebar/ResellZonePreviewSheet) */
   variant?: 'dialog' | 'sidebar';
}

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
   if (previousClose <= 0) return '0.00%';
   const changeRate = ((price - previousClose) / previousClose) * 100;
   return `${changeRate >= 0 ? '+' : ''}${changeRate.toFixed(2)}%`;
};

function MetricCard({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
   return (
      <div className="flex flex-col items-center gap-1 text-center px-2">
         <span className="text-[13px] font-medium text-[#646f7c] leading-normal">{label}</span>
         <span className={cn('text-[16px] font-bold text-[#161d24] leading-normal', valueClassName)}>{value}</span>
      </div>
   );
}

function MetricRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
   return (
      <div className="flex min-w-0 items-center gap-2">
         <span className="flex-1 text-caption-1-medium text-tertiary">{label}</span>
         <span className={cn('shrink-0 text-caption-1-bold text-tertiary', valueClassName)}>{value}</span>
      </div>
   );
}

export default function ResellPriceChart({ insights, zoneName, height = 200, variant = 'dialog' }: Props) {
   const [chartRange, setChartRange] = useState<ResellTradeRange>('minute');
   const pricePoints = insights.pricePointsByRange[chartRange];
   const priceValues = useMemo(() => pricePoints.map(p => p.price), [pricePoints]);
   const chartMin = Math.min(...priceValues);
   const chartMax = Math.max(...priceValues);

   const dayPrices = useMemo(
      () => insights.pricePointsByRange.day.map(p => p.price),
      [insights.pricePointsByRange.day],
   );
   const displayRecentTrade = pricePoints[pricePoints.length - 1]?.price ?? insights.previousClose;
   const displayDayLow = dayPrices.length > 0 ? Math.min(...dayPrices) : insights.dayLow;
   const displayDayHigh = dayPrices.length > 0 ? Math.max(...dayPrices) : insights.dayHigh;
   const displayChangeAmount = displayRecentTrade - insights.previousClose;
   const displayChangeRate = insights.previousClose > 0
      ? Number(((displayChangeAmount / insights.previousClose) * 100).toFixed(2))
      : 0;

   const yAxisStep = useMemo(() => {
      const range = Math.max(1, chartMax - chartMin);
      return Math.max(1000, Math.ceil(range / 4 / 1000) * 1000);
   }, [chartMax, chartMin]);

   const yAxisMin = useMemo(
      () => Math.max(0, Math.floor(chartMin / yAxisStep) * yAxisStep),
      [chartMin, yAxisStep],
   );

   const yAxisMax = useMemo(() => {
      const nextMax = Math.ceil(chartMax / yAxisStep) * yAxisStep;
      return nextMax === yAxisMin ? nextMax + yAxisStep : nextMax;
   }, [chartMax, yAxisMin, yAxisStep]);

   const chartOptions = useMemo<ApexOptions>(
      () => ({
         chart: {
            type: 'area',
            height,
            toolbar: { show: false },
            zoom: { enabled: false },
            sparkline: { enabled: false },
            animations: { enabled: false },
            fontFamily: 'inherit',
            parentHeightOffset: 0,
         },
         series: [{ name: '리셀 가격', data: pricePoints.map(p => p.price) }],
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
         stroke: { curve: 'straight', width: 3, lineCap: 'round' },
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
               if (!point) return '';
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
            padding: { top: 8, right: 18, bottom: 0, left: 12 },
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
         },
         xaxis: {
            categories: pricePoints.map(p => p.time),
            axisBorder: { show: false },
            axisTicks: { show: false },
            crosshairs: { show: false },
            tooltip: { enabled: false },
            labels: {
               offsetX: 4,
               style: {
                  colors: Array.from({ length: pricePoints.length }, () => '#8a94a6'),
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
               minWidth: 44,
               maxWidth: 44,
               align: 'left',
               offsetX: 6,
               style: { colors: ['#8a94a6'], fontSize: '12px', fontWeight: 400 },
               formatter: value => value.toLocaleString('ko-KR'),
            },
         },
      }),
      [height, insights.previousClose, pricePoints, yAxisMax, yAxisMin, yAxisStep],
   );

   return (
      <div className="flex flex-col gap-4">
         <div className="flex items-center gap-1">
            <h2 className="text-heading-3-bold text-foreground">거래 변동</h2>
            <span className={cn('text-label-2-semibold', displayChangeAmount >= 0 ? 'text-destructive' : 'text-primary')}>
               {displayChangeAmount >= 0 ? '+' : ''}
               {formatPrice(displayChangeAmount)} ({displayChangeRate}%)
            </span>
         </div>

         {variant === 'dialog' ? (
            <div className="bg-[#f7f8f9] rounded-xl grid grid-cols-3 py-4">
               <MetricCard label="최근 거래 체결가" value={formatPrice(displayRecentTrade)} />
               <MetricCard
                  label="금일 하한가"
                  value={formatPrice(displayDayLow)}
                  valueClassName="text-primary"
               />
               <MetricCard
                  label="금일 상한가"
                  value={formatPrice(displayDayHigh)}
                  valueClassName="text-destructive"
               />
            </div>
         ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
               <MetricRow label="전일 종가" value={formatPrice(insights.previousClose)} />
               <MetricRow label="최근 거래 체결가" value={formatPrice(displayRecentTrade)} />
               <MetricRow
                  label="금일 하한가"
                  value={formatPrice(displayDayLow)}
                  valueClassName="text-primary"
               />
               <MetricRow
                  label="금일 상한가"
                  value={formatPrice(displayDayHigh)}
                  valueClassName="text-destructive"
               />
            </div>
         )}

         <div className="flex rounded-xl bg-[#f1f2f4] p-1">
            {([
               { key: 'minute', label: '1분' },
               { key: 'day', label: '1일' },
            ] as const).map(item => (
               <button
                  key={item.key}
                  type="button"
                  onClick={() => setChartRange(item.key)}
                  className={cn(
                     'flex-1 rounded-lg px-2.5 py-2 text-body-2-bold transition-colors',
                     chartRange === item.key ? 'bg-background text-secondary' : 'text-disabled-foreground',
                  )}
               >
                  {item.label}
               </button>
            ))}
         </div>

         <div className="bg-background py-3">
            <div role="img" aria-label={zoneName ? `${zoneName} 리셀 가격 추이` : '리셀 가격 추이'}>
               <Chart
                  options={chartOptions}
                  series={chartOptions.series ?? []}
                  type="area"
                  height={height}
               />
            </div>
         </div>
      </div>
   );
}
