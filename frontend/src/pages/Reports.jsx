import { useEffect, useState } from "react";
import { api } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { exportToCSV, exportToPDF } from "../utils/export";

const TABS = [
  { id: "movement", label: "Stock Movement" },
  { id: "lowstock", label: "Low Stock" },
  { id: "valuation", label: "Inventory Valuation" },
];

export default function Reports() {
  const [tab, setTab] = useState("movement");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [movement, setMovement] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadReport = async () => {
    setLoading(true);
    try {
      if (tab === "movement") {
        const params = {};
        if (startDate) params.start_date = new Date(startDate).toISOString();
        if (endDate) params.end_date = new Date(endDate + "T23:59:59").toISOString();
        setMovement(await api.getStockMovement(params));
      } else if (tab === "lowstock") {
        setLowStock(await api.getLowStock());
      } else {
        setValuation(await api.getValuation());
      }
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [tab]);

  const exportMovementCSV = () => {
    exportToCSV(
      "stock-movement.csv",
      ["Date", "Product", "Type", "Quantity", "User", "Notes"],
      movement.map((tx) => [
        new Date(tx.created_at).toLocaleString(),
        tx.product_name,
        tx.transaction_type,
        tx.quantity,
        tx.user_name,
        tx.notes || "",
      ])
    );
  };

  const exportMovementPDF = () => {
    exportToPDF(
      "Stock Movement Report",
      ["Date", "Product", "Type", "Qty", "User"],
      movement.map((tx) => [
        new Date(tx.created_at).toLocaleDateString(),
        tx.product_name,
        tx.transaction_type.toUpperCase(),
        tx.quantity,
        tx.user_name,
      ]),
      "stock-movement.pdf"
    );
  };

  const exportLowStockCSV = () => {
    exportToCSV(
      "low-stock.csv",
      ["Name", "SKU", "Quantity", "Reorder Level", "Unit Price"],
      lowStock.map((p) => [p.name, p.sku, p.quantity_in_stock, p.reorder_level, p.unit_price])
    );
  };

  const exportValuationCSV = () => {
    if (!valuation) return;
    exportToCSV(
      "inventory-valuation.csv",
      ["Name", "SKU", "Quantity", "Unit Price", "Total Value"],
      [
        ...valuation.items.map((i) => [i.name, i.sku, i.quantity, i.unit_price, i.total_value]),
        ["", "", "", "Total", valuation.total_inventory_value],
      ]
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Reports</h1>
        <p className="text-sm text-slate-500">Generate and export inventory reports</p>
      </div>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.id ? "bg-accent text-white" : "bg-white text-slate-600 shadow-sm"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "movement" && (
        <div className="mb-4 flex flex-wrap gap-3">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
          <button onClick={loadReport} className="rounded-lg bg-navy px-4 py-2 text-sm text-white">Apply Filter</button>
          <button onClick={exportMovementCSV} className="rounded-lg border px-4 py-2 text-sm">Export CSV</button>
          <button onClick={exportMovementPDF} className="rounded-lg border px-4 py-2 text-sm">Export PDF</button>
        </div>
      )}

      {tab === "lowstock" && (
        <div className="mb-4">
          <button onClick={exportLowStockCSV} className="rounded-lg border px-4 py-2 text-sm">Export CSV</button>
        </div>
      )}

      {tab === "valuation" && (
        <div className="mb-4">
          <button onClick={exportValuationCSV} className="rounded-lg border px-4 py-2 text-sm">Export CSV</button>
        </div>
      )}

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {loading ? <LoadingSpinner /> : (
        <>
          {tab === "movement" && (
            <ReportTable
              headers={["Date", "Product", "Type", "Quantity", "User", "Notes"]}
              rows={movement.map((tx) => [
                new Date(tx.created_at).toLocaleString(),
                tx.product_name,
                tx.transaction_type.toUpperCase(),
                tx.quantity,
                tx.user_name,
                tx.notes || "—",
              ])}
            />
          )}
          {tab === "lowstock" && (
            <ReportTable
              headers={["Name", "SKU", "Stock", "Reorder Level", "Price"]}
              rows={lowStock.map((p) => [
                p.name, p.sku, p.quantity_in_stock, p.reorder_level, `UGX ${p.unit_price.toLocaleString()}`,
              ])}
              emptyMessage="All products are above reorder level"
            />
          )}
          {tab === "valuation" && valuation && (
            <>
              <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Total Inventory Value</p>
                <p className="text-3xl font-bold text-accent">UGX {valuation.total_inventory_value.toLocaleString()}</p>
              </div>
              <ReportTable
                headers={["Name", "SKU", "Qty", "Unit Price", "Total Value"]}
                rows={valuation.items.map((i) => [
                  i.name, i.sku, i.quantity, `UGX ${i.unit_price.toLocaleString()}`, `UGX ${i.total_value.toLocaleString()}`,
                ])}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function ReportTable({ headers, rows, emptyMessage = "No data for this report" }) {
  if (rows.length === 0) {
    return <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">{emptyMessage}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>{headers.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j} className="px-4 py-3">{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
