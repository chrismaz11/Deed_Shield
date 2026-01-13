'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type ReceiptRow = {
  receiptId: string;
  decision: string;
  riskScore: number;
  createdAt: string;
  anchorStatus: string;
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/api/v1/receipts`);
      const data = (await res.json()) as ReceiptRow[];
      setReceipts(data);
    };
    load();
  }, []);

  return (
    <div className="card">
      <h2>Receipts</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Receipt ID</th>
            <th>Decision</th>
            <th>Risk</th>
            <th>Created</th>
            <th>Anchor</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((receipt) => (
            <tr key={receipt.receiptId}>
              <td className="mono">
                <Link href={`/receipt/${receipt.receiptId}`}>{receipt.receiptId}</Link>
              </td>
              <td>{receipt.decision}</td>
              <td>{receipt.riskScore}</td>
              <td>{new Date(receipt.createdAt).toLocaleString()}</td>
              <td>{receipt.anchorStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {receipts.length === 0 && <p className="muted">No receipts yet. Run a verification first.</p>}
    </div>
  );
}
