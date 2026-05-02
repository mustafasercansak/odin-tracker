import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export const TrendChart: React.FC<TrendChartProps> = ({ parameter, data }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  if (data.length === 0) return null;

  const latestPoint = data[data.length - 1];

  // Get reference range from the latest point
  const refMin = latestPoint.referenceMin;
  const refMax = latestPoint.referenceMax;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as TrendDataPoint;
      return (
        <div className="bg-card border border-border p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-muted-foreground mb-1">
            {format(parseISO(point.date), 'd MMMM yyyy', { locale: dateLocale })}
          </p>
          <p className="text-lg font-bold text-primary">
            {point.value} <span className="text-sm font-medium">{point.unit}</span>
          </p>
          {point.wasConverted && (
            <p className="text-[10px] text-muted-foreground italic mb-1">
              ({t('trends.convertedFrom', { value: point.originalValue, unit: point.originalUnit })})
            </p>
          )}
          {point.labName && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
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
      className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
      data-report-chart={parameter}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">
            {getParameterLabel(parameter, latestPoint.originalLabel || '', t)}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">{latestPoint.value}</span>
            <span className="text-sm font-medium text-muted-foreground">{latestPoint.unit}</span>
            <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${latestPoint.flag === 'high' ? 'bg-destructive/10 text-destructive' :
                latestPoint.flag === 'low' ? 'bg-info/10 text-info' :
                  'bg-green-500/10 text-green-500'
              }`}>
              {latestPoint.flag ? t(`lab.flags.${latestPoint.flag}`) : t('lab.flags.normal')}
            </span>
          </div>
        </div>

        {(refMin !== null || refMax !== null) && (
          <div className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
            <p>{t('trends.referenceRange')}</p>
            <p className="text-foreground">
              {refMin !== null ? refMin : '0'} - {refMax !== null ? refMax : '∞'}
            </p>
          </div>
        )}
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="date"
              tickFormatter={(str) => format(parseISO(str), 'MMM d', { locale: dateLocale })}
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference Area Shading */}
            {refMin !== null && refMax !== null && (
              <ReferenceArea
                y1={refMin}
                y2={refMax}
                fill="var(--chart-ref-fill)"
                fillOpacity="var(--chart-ref-opacity)"
                stroke="none"
              />
            )}

            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-primary)"
              strokeWidth={3}
              dot={(props: any) => {
                const point = props.payload as TrendDataPoint;
                let color = 'var(--color-primary)';
                if (point.flag === 'high') color = 'var(--color-destructive)';
                if (point.flag === 'low') color = 'var(--color-info)';

                return (
                  <Dot
                    {...props}
                    r={5}
                    fill={color}
                    stroke="var(--color-card)"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          {t('trends.recentValues')}
        </h4>
        <div className="space-y-2">
          {data.slice(-3).reverse().map((point, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                {format(parseISO(point.date), 'd MMMM yyyy', { locale: dateLocale })}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{point.value}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${point.flag === 'high' ? 'bg-destructive' :
                    point.flag === 'low' ? 'bg-info' :
                      'bg-green-500'
                  }`}></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
