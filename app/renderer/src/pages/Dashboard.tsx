import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { CategoryScale, Chart as ChartJS, LinearScale, BarElement } from 'chart.js';
import { last7DaysSales, todaySummary } from '../services/reports';
import { ipc } from '../services/ipcClient';
import { getAuthContext } from '../services/session';
import {
  toCashStatusSummary,
  toSalesByDayPoints,
  toTodayDashboardSummary,
  type CashStatusSummary,
  type SalesByDayPoint,
  type TodayDashboardSummary,
} from '../services/reportAdapters';

ChartJS.register(CategoryScale, LinearScale, BarElement);

const money = (n: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
};

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [today, setToday] = useState<TodayDashboardSummary>({
    totalSales: 0,
    cashSales: 0,
    totalExpenses: 0,
    totalCosts: 0,
    totalReturns: 0,
    netSales: 0,
  });

  const [cashStatus, setCashStatus] = useState<CashStatusSummary | null>(null);
  const [sales7, setSales7] = useState<SalesByDayPoint[]>([]);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const [tRaw, s7Raw, cash] = await Promise.all([
        todaySummary(),
        last7DaysSales(),
        ipc.cash.getStatus(getAuthContext()),
      ]);

      setToday(toTodayDashboardSummary(tRaw));
      setSales7(toSalesByDayPoints(s7Raw));
      setCashStatus(toCashStatusSummary(cash));
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar el dashboard');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void load(false);

    const timer = window.setInterval(() => {
      void load(true);
    }, 10000);

    return () => window.clearInterval(timer);
  }, []);

  const utility = today.netSales - today.totalCosts - today.totalExpenses;

  const chartLabels = useMemo(() => sales7.map((d) => d.label).filter(Boolean), [sales7]);
  const chartData = useMemo(() => sales7.map((d) => d.total), [sales7]);

  if (loading) return <div className="card">Cargando dashboard...</div>;
  if (error) return <div className="card">Error: {error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard__hero card">
        <div>
          <div className="dashboard__eyebrow">Resumen general</div>
          <h2 className="dashboard__title">Panel principal del sistema</h2>
          <p className="dashboard__text">
            Consulta rápidamente ventas, devoluciones, gastos, utilidad y estado actual de caja.
          </p>
        </div>
      </div>

      <div className="grid grid-2 dashboard__stats">
        <div className="card stat-card">
          <div className="stat-card__label">Ventas brutas hoy</div>
          <div className="stat-card__value">{money(today.totalSales)}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Devoluciones hoy</div>
          <div className="stat-card__value">{money(today.totalReturns)}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Ventas netas hoy</div>
          <div className="stat-card__value">{money(today.netSales)}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Ventas en efectivo hoy</div>
          <div className="stat-card__value">{money(today.cashSales)}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Gastos hoy</div>
          <div className="stat-card__value">{money(today.totalExpenses)}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Utilidad estimada hoy</div>
          <div className="stat-card__value">{money(utility)}</div>
        </div>
      </div>

      {cashStatus && (
        <div className="card dashboard__cash-card">
          <div className="dashboard__section-title">Caja abierta (turno actual)</div>

          <div className="dashboard__cash-value">
            Efectivo esperado actual: <strong>{money(cashStatus.expectedCash)}</strong>
          </div>

          <div className="dashboard__cash-value">
            Ventas efectivo turno: <strong>{money(cashStatus.cashSales)}</strong>
          </div>

          <div className="dashboard__cash-value">
            Gastos turno: <strong>{money(cashStatus.expenses)}</strong>
          </div>

          <div className="dashboard__cash-value">
            Devoluciones efectivo turno: <strong>{money(cashStatus.cashReturns)}</strong>
          </div>
        </div>
      )}

      <div className="card dashboard__chart-card">
        <div className="dashboard__section-title">Ventas por día (últimos 7 días)</div>
        <Bar
          data={{
            labels: chartLabels,
            datasets: [
              {
                label: 'Ventas',
                data: chartData,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                labels: {
                  color: '#e8eefc',
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  color: '#a9b6d6',
                },
                grid: {
                  color: 'rgba(255,255,255,.05)',
                },
              },
              y: {
                ticks: {
                  color: '#a9b6d6',
                },
                grid: {
                  color: 'rgba(255,255,255,.05)',
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
};
