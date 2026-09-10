"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function HistoryPage() {
  // รายการประวัติการขายทั้งหมด
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sold_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSales(data);
      setErrorMsg("");
    }
    setLoading(false);
  }

  // คำนวณยอดขายรวมทั้งหมดจากทุกรายการ
  const totalSales = sales.reduce(
    (sum, s) => sum + (Number(s.total_price) || 0),
    0
  );

  // จัดรูปแบบวันเวลาให้อ่านง่าย
  function formatDateTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <div>
      <h1>ประวัติการขาย</h1>

      {errorMsg && <p style={{ color: "red" }}>เกิดข้อผิดพลาด: {errorMsg}</p>}

      {/* สรุปยอดขายรวมทั้งหมด */}
      <div className="card">
        <h2>ยอดขายรวมทั้งหมด: {totalSales.toLocaleString()} บาท</h2>
      </div>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>วันเวลาที่ขาย</th>
              <th>ชื่อสินค้า</th>
              <th>จำนวน</th>
              <th>ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{formatDateTime(s.sold_at)}</td>
                <td>{s.product_name}</td>
                <td>{s.quantity}</td>
                <td>{Number(s.total_price).toLocaleString()} บาท</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={4}>ยังไม่มีประวัติการขาย</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
