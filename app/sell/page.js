"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function SellPage() {
  // รายการสินค้าทั้งหมด (สำหรับ dropdown)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // สินค้าที่เลือกและจำนวนที่จะขาย
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  // สถานะระหว่างบันทึกการขาย + ข้อความแจ้งผล
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setProducts(data);
      setErrorMsg("");
    }
    setLoading(false);
  }

  // หาสินค้าที่เลือกอยู่จาก id
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // คำนวณยอดรวมอัตโนมัติ
  const qtyNumber = parseInt(quantity, 10) || 0;
  const totalPrice = selectedProduct ? selectedProduct.price * qtyNumber : 0;

  async function handleSell(e) {
    e.preventDefault();
    setSuccessMsg("");

    if (!selectedProduct) {
      alert("กรุณาเลือกสินค้า");
      return;
    }
    if (qtyNumber <= 0) {
      alert("กรุณากรอกจำนวนให้ถูกต้อง");
      return;
    }

    // ตรวจสอบ stock เพียงพอหรือไม่
    if (qtyNumber > selectedProduct.stock) {
      alert(
        `สินค้าคงเหลือไม่พอ (คงเหลือ ${selectedProduct.stock} ${selectedProduct.unit})`
      );
      return;
    }

    setSubmitting(true);

    // 1) บันทึกรายการขายลงตาราง sales
    const { error: saleError } = await supabase.from("sales").insert([
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: qtyNumber,
        total_price: totalPrice,
        sold_at: new Date().toISOString(),
      },
    ]);

    if (saleError) {
      alert("บันทึกการขายไม่สำเร็จ: " + saleError.message);
      setSubmitting(false);
      return;
    }

    // 2) อัปเดต stock ให้ลดลงตามจำนวนที่ขาย
    const newStock = selectedProduct.stock - qtyNumber;
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", selectedProduct.id);

    if (updateError) {
      alert("อัปเดตสต็อกไม่สำเร็จ: " + updateError.message);
      setSubmitting(false);
      return;
    }

    // สำเร็จ: แจ้งผลและรีเซ็ตฟอร์ม
    setSuccessMsg(
      `ขาย "${selectedProduct.name}" จำนวน ${qtyNumber} ${selectedProduct.unit} สำเร็จ ยอดรวม ${totalPrice} บาท`
    );
    setSelectedProductId("");
    setQuantity("");
    setSubmitting(false);
    fetchProducts(); // โหลด stock ล่าสุด
  }

  return (
    <div>
      <h1>ขายสินค้า</h1>

      {errorMsg && <p style={{ color: "red" }}>เกิดข้อผิดพลาด: {errorMsg}</p>}
      {successMsg && <p style={{ color: "green" }}>{successMsg}</p>}

      <div className="card">
        {loading ? (
          <p>กำลังโหลดสินค้า...</p>
        ) : (
          <form onSubmit={handleSell}>
            <div className="form-row">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">-- เลือกสินค้า --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ราคา {p.price} บาท / {p.unit}) - คงเหลือ {p.stock}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="จำนวน"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <button type="submit" disabled={submitting}>
                {submitting ? "กำลังบันทึก..." : "ขาย"}
              </button>
            </div>

            {/* แสดงยอดรวมอัตโนมัติ */}
            {selectedProduct && qtyNumber > 0 && (
              <p>
                ยอดรวม: <strong>{totalPrice} บาท</strong>{" "}
                (คงเหลือหลังขาย: {selectedProduct.stock - qtyNumber >= 0
                  ? selectedProduct.stock - qtyNumber
                  : "ไม่พอ"}{" "}
                {selectedProduct.unit})
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
