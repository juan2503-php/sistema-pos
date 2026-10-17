import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { formatCurrency } from '../utils/helpers';

echarts.use([GridComponent, TooltipComponent, LineChart, CanvasRenderer, UniversalTransition]);

export default function WeeklySalesChart({ salesByDay = [] }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Días ordenados de izquierda a derecha: Lunes a Domingo
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const weekDataMap = { Lun: 0, Mar: 0, Mié: 0, Jue: 0, Vie: 0, Sáb: 0, Dom: 0 };

    // Calcular el día actual en la escala Lunes (0) a Domingo (6)
    const today = new Date();
    const todayJsDay = today.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const currentWeekDayIndex = todayJsDay === 0 ? 6 : todayJsDay - 1;

    salesByDay.forEach((item) => {
      if (!item.date) return;
      // Normalizar fecha
      const [year, month, day] = item.date.split('-').map(Number);
      const d = new Date(year, month - 1, day, 12, 0, 0);
      const dayIndex = d.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
      const dayKeys = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const key = dayKeys[dayIndex];
      if (weekDataMap[key] !== undefined) {
        weekDataMap[key] += parseFloat(item.revenue) || 0;
      }
    });

    // Los días futuros de la semana se dejan en null para que la curva no caiga a cero artificialmente
    const seriesData = weekDays.map((day, index) => {
      if (index > currentWeekDayIndex) {
        return null;
      }
      return weekDataMap[day];
    });

    const isDarkMode = document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const textColor = isDarkMode ? '#9ca3af' : '#6b7280';
    const splitLineColor = isDarkMode ? '#374151' : '#e5e7eb';

    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        textStyle: {
          color: isDarkMode ? '#f3f4f6' : '#111827',
          fontFamily: 'inherit',
          fontSize: 12,
        },
        padding: [8, 12],
        formatter: (params) => {
          const item = params[0];
          if (!item || item.value === null || item.value === undefined) {
            return `<div style="font-weight:600;margin-bottom:4px;">${item?.name || ''}</div>
                    <div style="color:#9ca3af;font-size:12px;">Sin datos (día no transcurrido)</div>`;
          }
          return `<div style="font-weight:600;margin-bottom:4px;">${item.name}</div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;"></span>
                    <span>Ventas: <b>${formatCurrency(item.value)}</b></span>
                  </div>`;
        },
      },
      grid: {
        left: '2%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: weekDays,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textColor,
          fontSize: 12,
          fontWeight: 500,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textColor,
          fontSize: 11,
          formatter: (val) => {
            if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
            if (val >= 1000) return `$${Math.round(val / 1000)}k`;
            return `$${val}`;
          },
        },
        splitLine: {
          lineStyle: {
            color: splitLineColor,
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: 'Ventas',
          data: seriesData,
          type: 'line',
          smooth: true,
          connectNulls: false,
          symbol: 'circle',
          symbolSize: 8,
          showSymbol: true,
          itemStyle: {
            color: '#3b82f6',
            borderColor: isDarkMode ? '#1f2937' : '#ffffff',
            borderWidth: 2,
          },
          lineStyle: {
            color: '#3b82f6',
            width: 3,
            shadowColor: 'rgba(59, 130, 246, 0.35)',
            shadowBlur: 10,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.01)' },
              ],
            },
          },
          animationDuration: 1000,
          animationEasing: 'cubicOut',
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [salesByDay]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return <div ref={chartRef} className="w-full h-full min-h-[280px]" />;
}
