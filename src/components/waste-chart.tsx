'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts';
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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { useMemo } from 'react';

const chartConfig = {
  Plástico: {
    label: 'Plástico',
    color: 'hsl(var(--chart-1))',
  },
  Papel: {
    label: 'Papel',
    color: 'hsl(var(--chart-2))',
  },
  Metal: {
    label: 'Metal',
    color: 'hsl(var(--chart-3))',
  },
  Orgânico: {
    label: 'Orgânico',
    color: 'hsl(var(--chart-4))',
  },
  Vidro: {
    label: 'Vidro',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

export function WasteChart() {
  const { wasteEntries, currentUser } = useEcosystem();

  const chartData = useMemo(() => {
    // Filtra dados pela escola (ou mostra tudo se for super_admin)
    const filteredEntries = wasteEntries.filter(entry => 
      currentUser?.role === 'super_admin' ? true : entry.schoolId === currentUser?.schoolId
    );

    // Processa apenas dados reais (atuais) do ciclo ativo
    const allData = filteredEntries.map(entry => {
      // Formato: "Mai 26" ou "Jun 26"
      const date = new Date(entry.date);
      const monthKey = !isNaN(date.getTime()) 
        ? date.toLocaleString('default', { month: 'short', year: '2-digit' })
        : 'Desconhecido';

      return {
        type: entry.type,
        collected: entry.collected,
        monthKey
      };
    });

    const monthlyData = allData.reduce((acc, item) => {
      const monthKey = item.monthKey;
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey };
      }
      acc[monthKey][item.type] = (acc[monthKey][item.type] || 0) + item.collected;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData);
  }, [wasteEntries]);

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
          Métricas de impacto ambiental atualizadas em tempo real.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart 
            accessibilityLayer 
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillPlástico" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-Plástico)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-Plástico)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="fillPapel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-Papel)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-Papel)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="fillMetal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-Metal)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-Metal)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="fillOrgânico" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-Orgânico)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-Orgânico)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.toUpperCase()}
              className="text-[10px] font-bold"
            />
            <YAxis 
               tickLine={false}
               axisLine={false}
               className="text-[10px] font-medium"
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              content={<ChartTooltipContent indicator="line" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="Plástico"
              fill="url(#fillPlástico)"
              stroke="var(--color-Plástico)"
              radius={[6, 6, 0, 0]}
              animationBegin={200}
              animationDuration={1500}
            />
            <Bar
              dataKey="Papel"
              fill="url(#fillPapel)"
              stroke="var(--color-Papel)"
              radius={[6, 6, 0, 0]}
              animationBegin={400}
              animationDuration={1500}
            />
            <Bar
              dataKey="Metal"
              fill="url(#fillMetal)"
              stroke="var(--color-Metal)"
              radius={[6, 6, 0, 0]}
              animationBegin={600}
              animationDuration={1500}
            />
            <Bar
              dataKey="Orgânico"
              fill="url(#fillOrgânico)"
              stroke="var(--color-Orgânico)"
              radius={[6, 6, 0, 0]}
              animationBegin={800}
              animationDuration={1500}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
