import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

function StatCard({ label, value, accent, alert }) {
  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm ${alert ? "border-l-4 border-red-500" : "border-l-4 border-accent"}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent || "text-navy"}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsData, chartsData] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardCharts(),
      ]);
      setStats(statsData);
      setCharts(chartsData);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
        {error}
        <button onClick={loadData} className="ml-4 underline">Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your inventory — refreshes every 30s</p>
        </div>
        <button
          onClick={loadData}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-white"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Products" value={stats.total_products} />
        <StatCard
          label="Low Stock Alerts"
          value={stats.low_stock_count}
          accent="text-red-600"
          alert={stats.low_stock_count > 0}
        />
        <StatCard
          label="Inventory Value"
          value={`UGX ${stats.total_inventory_value.toLocaleString()}`}
        />
        <StatCard label="Recent Actions" value={stats.recent_activity.length} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-navy">Stock by Category</h2>
          {charts.stock_by_category.length === 0 ? (
            <p className="text-sm text-slate-400">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.stock_by_category}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_quantity" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-navy">Top 5 Products by Stock</h2>
          {charts.top_products.length === 0 ? (
            <p className="text-sm text-slate-400">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.top_products} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#0f172a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 font-semibold text-navy">Inventory Value (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts.inventory_value_over_time}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v) => [`UGX ${v.toLocaleString()}`, "Value"]} />
              <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-navy">Recent Activity</h2>
        {stats.recent_activity.length === 0 ? (
          <p className="text-sm text-slate-400">No activity yet</p>
        ) : (
          <div className="divide-y">
            {stats.recent_activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-slate-400">by {item.user_name}</p>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
