import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Props = {
  labels: string[];
  series: number[];
};

export default function IngresosLineChart({ labels, series }: Props) {
  const data = labels.map((label, i) => ({
    fecha: label,
    ingresos: series[i] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fecha" />
        <YAxis />
        <Tooltip
          formatter={(value?: number) => {
            const v = typeof value === 'number' ? value : 0;
            return `S/ ${v.toFixed(2)}`;
          }}
        />        <Line
          type="monotone"
          dataKey="ingresos"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
