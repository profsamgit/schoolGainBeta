'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
import { wasteData } from '@/lib/data';

const monthlyData = wasteData.reduce((acc, item) => {
  const month = new Date(item.date).toLocaleString('default', { month: 'short' });
  if (!acc[month]) {
    acc[month] = { month };
  }
  acc[month][item.type] = item.collected;
  return acc;
}, {} as Record<string, any>);

const chartData = Object.values(monthlyData);

const chartConfig = {
  Plástico: {
    label: 'Plástico',
    color: 'hsl(var(--chart-plastico))',
  },
  Papel: {
    label: 'Papel',
    color: 'hsl(var(--chart-papel))',
  },
  Metal: {
    label: 'Metal',
    color: 'hsl(var(--chart-metal))',
  },
  Orgânico: {
    label: 'Orgânico',
    color: 'hsl(var(--chart-organico))',
  },
} satisfies ChartConfig;

export function WasteChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Total de Resíduos Coletados (kg)</CardTitle>
        <CardDescription>
          Visualização da coleta de resíduos por tipo nos últimos meses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="Plástico"
              fill="var(--color-Plástico)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Papel"
              fill="var(--color-Papel)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Metal"
              fill="var(--color-Metal)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Orgânico"
              fill="var(--color-Orgânico)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
