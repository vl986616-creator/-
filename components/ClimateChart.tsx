import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { WeatherData } from '../types';

interface Props {
  data: WeatherData;
}

const ClimateChart: React.FC<Props> = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Aggregate daily data into monthly averages
    const monthlyStats: Record<string, { tSum: number, hSum: number, count: number }> = {};
    
    data.time.forEach((dateStr, idx) => {
      const month = dateStr.slice(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = { tSum: 0, hSum: 0, count: 0 };
      }
      monthlyStats[month].tSum += data.temperature_2m_mean[idx];
      monthlyStats[month].hSum += data.relative_humidity_2m_mean[idx];
      monthlyStats[month].count++;
    });

    return Object.keys(monthlyStats).sort().map(month => {
      const stats = monthlyStats[month];
      return {
        name: new Date(month + "-01").toLocaleDateString('en-US', { month: 'short' }),
        temp: Math.round(stats.tSum / stats.count),
        humidity: Math.round(stats.hSum / stats.count)
      };
    });
  }, [data]);

  if (!chartData.length) return <div className="text-gray-400 text-sm">暂无气候数据</div>;

  return (
    <div className="w-full h-64 bg-white rounded-xl p-2">
      <h3 className="text-sm font-bold text-gray-700 mb-2 pl-2 border-l-4 border-blue-500">
        气候环境 (12-Month Avg)
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{fontSize: 10}} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            stroke="#f97316" 
            tick={{fontSize: 10}} 
            label={{ value: '温度 (°C)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#f97316' }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#3b82f6" 
            tick={{fontSize: 10}} 
            label={{ value: '湿度 (%)', angle: 90, position: 'insideRight', fontSize: 10, fill: '#3b82f6' }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
          <Bar yAxisId="left" dataKey="temp" name="平均温度 (°C)" barSize={20} fill="#fdba74" radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="humidity" name="相对湿度 (%)" stroke="#3b82f6" strokeWidth={2} dot={{r:2}} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClimateChart;