import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  Dot,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { type TrendDataPoint } from '@/hooks/queries/useTrendData';
import { getParameterLabel } from '@/lib/i18n-helpers';

interface TrendChartProps {
  parameter: string;
  data: TrendDataPoint[];
}

const isSelectedPoint = (point: TrendDataPoint, latestPoint: TrendDataPoint) => {
  return point.date === latestPoint.date;
};

export const TrendChart: React.FC<TrendChartProps> = ({ parameter, data }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState<{ width: number, height: number } | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      }
    });
    
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (data.length === 0) return null;

  const latestPoint = data[data.length - 1];

  // Get reference range from the latest point
  const refMin = latestPoint.referenceMin;
  const refMax = latestPoint.referenceMax;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as TrendDataPoint;
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl min-w-[160px]">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 border-b border-border pb-2">
            {format(parseISO(point.date), 'd MMMM yyyy', { locale: dateLocale })}
          </p>
          <div className="flex flex-col gap-1">
            <p className="text-xl font-bold text-primary">
              {point.value} <span className="text-xs font-medium text-muted-foreground">{point.unit}</span>
            </p>
            {point.flag && (
              <span className={`text-[10px] font-bold uppercase ${
                point.flag === 'high' ? 'text-destructive' : 'text-info'
              }`}>
                {t(`lab.flags.${point.flag}`)}
              </span>
            )}
          </div>
          {point.wasConverted && (
            <p className="text-[10px] text-muted-foreground italic mt-2 opacity-70">
              {t('trends.convertedFrom', { value: point.originalValue, unit: point.originalUnit })}
            </p>
          )}
          {point.labName && (
            <p className="text-[10px] font-medium text-muted-foreground mt-3 pt-2 border-t border-border/50">
              {point.labName}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="bg-card border border-border rounded-[32px] p-8 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 group"
      data-report-chart={parameter}
    >
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-1">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {getParameterLabel(parameter, latestPoint.originalLabel || '', t)}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight group-hover:text-primary transition-colors duration-500">
              {latestPoint.value}
            </span>
            <span className="text-sm font-medium text-muted-foreground">{latestPoint.unit}</span>
            <span className={`ml-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              latestPoint.flag === 'high' ? 'bg-destructive/10 text-destructive' :
              latestPoint.flag === 'low' ? 'bg-info/10 text-info' :
              'bg-green-500/10 text-green-500'
            }`}>
              {latestPoint.flag ? t(`lab.flags.${latestPoint.flag}`) : t('lab.flags.normal')}
            </span>
          </div>
        </div>

        {(refMin !== null || refMax !== null) && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-50">
              {t('trends.referenceRange')}
            </p>
            <p className="text-xs font-bold font-mono">
              {refMin !== null ? refMin : '0'} - {refMax !== null ? refMax : '∞'}
            </p>
          </div>
        )}
      </div>

      <div ref={containerRef} className="h-[220px] w-full flex items-center justify-center overflow-hidden">
        {dimensions ? (
          <LineChart 
            width={dimensions.width} 
            height={dimensions.height} 
            data={data} 
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`gradient-${parameter}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--chart-grid)" opacity={0.5} />
            <XAxis
              dataKey="date"
              tickFormatter={(str) => format(parseISO(str), 'MMM d', { locale: dateLocale })}
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              dx={-5}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
              isAnimationActive={false}
            />

            {refMin !== null && refMax !== null && (
              <ReferenceArea
                y1={refMin}
                y2={refMax}
                fill="var(--chart-ref-fill)"
                fillOpacity={0.05}
                stroke="none"
              />
            )}

            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-primary)"
              strokeWidth={4}
              dot={(props: any) => {
                const point = props.payload as TrendDataPoint;
                let color = 'var(--color-primary)';
                if (point.flag === 'high') color = 'var(--color-destructive)';
                if (point.flag === 'low') color = 'var(--color-info)';

                return (
                  <Dot
                    {...props}
                    r={isSelectedPoint(point, latestPoint) ? 6 : 4}
                    fill={color}
                    stroke="var(--color-card)"
                    strokeWidth={isSelectedPoint(point, latestPoint) ? 3 : 2}
                    className="transition-all duration-300"
                  />
                );
              }}
              activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--color-primary)' }}
              animationDuration={2000}
            />
          </LineChart>
        ) : (
          <div className="w-full h-full bg-primary/5 animate-pulse rounded-2xl flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {t('common.loading')}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {t('trends.recentValues')}
          </h4>
          <span className="text-[10px] font-medium text-muted-foreground opacity-50">
            {t('trends.lastN', { n: 3 })}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {data.slice(-3).reverse().map((point, idx) => (
            <div key={idx} className="bg-secondary/30 rounded-2xl p-3 flex flex-col gap-1 group/item hover:bg-secondary/50 transition-colors">
              <span className="text-[10px] text-muted-foreground font-medium">
                {format(parseISO(point.date), 'd MMM', { locale: dateLocale })}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold">{point.value}</span>
                <div className={`w-1 h-1 rounded-full ${
                  point.flag === 'high' ? 'bg-destructive' :
                  point.flag === 'low' ? 'bg-info' :
                  'bg-green-500'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

