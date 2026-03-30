import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { CategoryScale, Chart as ChartJS, LinearScale, BarElement } from 'chart.js';
import { salesByDay, summary, topProducts } from '../services/reports';
import {
  toReportSummary,
  toSalesByDayPoints,
  toTopProductPoints,
  type ReportSummary,
  type SalesByDayPoint,
  type TopProductPoint,
} from '../services/reportAdapters';

ChartJS.register(CategoryScale, LinearScale, BarElement);

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const money = (n: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const EMPTY_SUMMARY: ReportSummary = {
  totalSales: 0,
  totalReturns: 0,
  netSales: 0,
  totalCosts: 0,
  totalExpenses: 0,
  utility: 0,
};

export const Reports = () => {
  const [data, setData] = useState<SalesByDayPoint[]>([]);
  const [top, setTop] = useState<TopProductPoint[]>([]);
  const [sum, setSum] = useState<ReportSummary>(EMPTY_SUMMARY);
  const [error, setError] = useState('');

  const from = useMemo(() => isoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), []);
  const to = useMemo(() => isoDate(new Date()), []);

  useEffect(() => {
    void (async () => {
      setError('');

      try {
        const [dRaw, tRaw, sRaw] = await Promise.all([
          salesByDay(from, to),
          topProducts(from, to),
          summary(from, to),
        ]);

        setData(toSalesByDayPoints(dRaw));
        setTop(toTopProductPoints(tRaw));
        setSum(toReportSummary(sRaw));
      } catch (e: any) {
        setError(e?.message || 'No se pudieron cargar los reportes');
        setData([]);
        setTop([]);
        setSum(EMPTY_SUMMARY);
      }
    })();
  }, [from, to]);

  const labels = useMemo(() => data.map((d) => d.label), [data]);
  const totals = useMemo(() => data.map((d) => d.total), [data]);

  return (
    <div className="dashboard">
      <div className="card dashboard__hero">
        <div>
          <div className="dashboard__eyebrow">Reportes</div>
          <h2 className="dashboard__title">Análisis de ventas y rendimiento</h2>
          <p className="dashboard__text">
            Consulta ventas, devoluciones, gastos y utilidad del período.
          </p>
        </div>
      </div>

      {error && <div className="card">Error: {error}</div>}

      <div className="grid grid-2 dashboard__stats">

        <div className="card stat-card">
          <div className="stat-card__label">Ventas brutas</div>
          <div className="stat-card__value">{money(sum.totalSales)}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Devoluciones</div>
          <div className="stat-card__value">{money(sum.totalReturns)}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Ventas netas</div>
          <div className="stat-card__value">{money(sum.netSales)}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Gastos</div>
          <div className="stat-card__value">{money(sum.totalExpenses)}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Costos</div>
          <div className="stat-card__value">{money(sum.totalCosts)}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Utilidad</div>
          <div className="stat-card__value">{money(sum.utility)}</div>
        </div>

      </div>

      <div className="card dashboard__chart-card">
        <div className="dashboard__section-title">Ventas por día</div>

        <Bar
          data={{
            labels,
            datasets: [
              {
                label: 'Ventas',
                data: totals,
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
                ticks: { color: '#a9b6d6' },
                grid: { color: 'rgba(255,255,255,.05)' },
              },
              y: {
                ticks: { color: '#a9b6d6' },
                grid: { color: 'rgba(255,255,255,.05)' },
              },
            },
          }}
        />

      </div>

      <div className="card">
        <div className="dashboard__section-title">Top productos</div>

        {top.length === 0 && (
          <div style={{ opacity: 0.8 }}>Sin datos.</div>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {top.map((t, i) => (
            <div
              key={String(t.name || i)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 14,
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.06)',
              }}
            >
              <span style={{ fontWeight: 700 }}>
                {t.name}
              </span>

              <span style={{ color: 'var(--muted)' }}>
                {t.qty} vendidos
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
