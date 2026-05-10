'use client';
import { Pie, PieChart, Tooltip, Legend, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useEcosystem } from '../../app/(app)/ecosystem-context';
import { useMemo } from 'react';

const chartConfig = {
  Plástico: {
    label: 'Plástico',
    color: '#ef4444',
  },
  Papel: {
    label: 'Papel',
    color: '#3b82f6',
  },
  Metal: {
    label: 'Metal',
    color: '#facc15',
  },
  Orgânico: {
    label: 'Orgânico',
    color: '#78350f',
  },
  Vidro: {
    label: 'Vidro',
    color: '#10b981',
  },
} satisfies ChartConfig;

export function WasteChart() {
  const { wasteEntries, currentUser } = useEcosystem();

  const chartData = useMemo(() => {
    const filteredEntries = wasteEntries.filter(entry => 
      currentUser?.role === 'super_admin' ? true : entry.schoolId === currentUser?.schoolId
    );

    const totals = filteredEntries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + entry.collected;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(totals).map(([type, value]) => ({
      name: type,
      value: value as number,
      fill: (chartConfig as any)[type]?.color || '#cbd5e1'
    })).sort((a, b) => (b.value as number) - (a.value as number));
  }, [wasteEntries, currentUser]);

  const totalCollected = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (curr.value as number), 0);
  }, [chartData]);

  return (
    <Card className="border-none shadow-2xl bg-gradient-to-br from-card to-background overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
      </div>
      
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
          <div className="h-2 w-8 bg-primary rounded-full" />
          Volume de Coleta Real-Time
        </CardTitle>
        <CardDescription className="font-medium">
          Distribuição proporcional por categoria de resíduo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={5}
              strokeWidth={2}
              stroke="hsl(var(--background))"
              animationBegin={200}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
              ))}
            </Pie>
            <Tooltip 
              content={<ChartTooltipContent hideLabel />}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              content={({ payload }) => (
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {payload?.map((entry: any, index: number) => (
                    <div key={`legend-${index}`} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: entry.color }} 
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {entry.value} ({((chartData[index].value / totalCollected) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
