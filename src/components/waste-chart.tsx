'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
              }}
            />
            <Legend />
            <Bar dataKey="Plástico" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Papel" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Metal" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Orgânico" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
