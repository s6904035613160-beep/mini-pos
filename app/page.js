"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ProductsPage() {
  // รายการสินค้าทั้งหมด
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ฟอร์มเพิ่มสินค้าใหม่
  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    price: "",
    stock: "",
    unit: "",
  });

  // เก็บ id ของแถวที่กำลังแก้ไข และค่าที่กำลังแก้
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  // โหลดสินค้าทั้งหมดตอนเปิดหน้า
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setProducts(data);
      setErrorMsg("");
    }
    setLoading(false);
  }

  // เพิ่มสินค้าใหม่
  async function handleAddProduct(e) {
    e.preventDefault();
    if (!newProduct.sku || !newProduct.name) {
      alert("กรุณากรอก SKU และชื่อสินค้า");
      return;
    }

    const { error } = await supabase.from("products").insert([
      {
        sku: newProduct.sku,
        name: newProduct.name,
        price: parseFloat(newProduct.price) || 0,
        stock: parseInt(newProduct.stock, 10) || 0,
        unit: newProduct.unit,
      },
    ]);

    if (error) {
      alert("เพิ่มสินค้าไม่สำเร็จ: " + error.message);
      return;
    }

    setNewProduct({ sku: "", name: "", price: "", stock: "", unit: "" });
    fetchProducts();
  }

  // เริ่มแก้ไขแถว
  function startEdit(product) {
    setEditingId(product.id);
    setEditValues({
      sku: product.sku,
      name: product.name,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  // บันทึกการแก้ไข
  async function saveEdit(id) {
    const { error } = await supabase
      .from("products")
      .update({
        sku: editValues.sku,
        name: editValues.name,
        price: parseFloat(editValues.price) || 0,
        stock: parseInt(editValues.stock, 10) || 0,
        unit: editValues.unit,
      })
      .eq("id", id);

    if (error) {
      alert("แก้ไขไม่สำเร็จ: " + error.message);
      return;
    }

    setEditingId(null);
    setEditValues({});
    fetchProducts();
  }

  // ลบสินค้า
  async function handleDelete(id) {
    if (!confirm("ยืนยันการลบสินค้านี้?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert("ลบไม่สำเร็จ: " + error.message);
      return;
    }
    fetchProducts();
  }

  return (
    <div>
      <h1>รายการสินค้า</h1>

      {errorMsg && <p style={{ color: "red" }}>เกิดข้อผิดพลาด: {errorMsg}</p>}

      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <div className="card">
        <h2>เพิ่มสินค้าใหม่</h2>
        <form onSubmit={handleAddProduct}>
          <div className="form-row">
            <input
              type="text"
              placeholder="SKU"
              value={newProduct.sku}
              onChange={(e) =>
                setNewProduct({ ...newProduct, sku: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="ชื่อสินค้า"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="ราคา"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="คงเหลือ"
              value={newProduct.stock}
              onChange={(e) =>
                setNewProduct({ ...newProduct, stock: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="หน่วย"
              value={newProduct.unit}
              onChange={(e) =>
                setNewProduct({ ...newProduct, unit: e.target.value })
              }
            />
            <button type="submit">เพิ่มสินค้า</button>
          </div>
        </form>
      </div>

      {/* ตารางแสดงสินค้า */}
      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>ชื่อสินค้า</th>
              <th>ราคา</th>
              <th>คงเหลือ</th>
              <th>หน่วย</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isEditing = editingId === p.id;
              return (
                <tr key={p.id}>
                  {isEditing ? (
                    <>
                      <td>
                        <input
                          value={editValues.sku}
                          onChange={(e) =>
                            setEditValues({ ...editValues, sku: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={editValues.name}
                          onChange={(e) =>
                            setEditValues({ ...editValues, name: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editValues.price}
                          onChange={(e) =>
                            setEditValues({ ...editValues, price: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editValues.stock}
                          onChange={(e) =>
                            setEditValues({ ...editValues, stock: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={editValues.unit}
                          onChange={(e) =>
                            setEditValues({ ...editValues, unit: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <button onClick={() => saveEdit(p.id)}>บันทึก</button>{" "}
                        <button onClick={cancelEdit}>ยกเลิก</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{p.sku}</td>
                      <td>{p.name}</td>
                      <td>{p.price}</td>
                      <td>{p.stock}</td>
                      <td>{p.unit}</td>
                      <td>
                        <button onClick={() => startEdit(p)}>แก้ไข</button>{" "}
                        <button onClick={() => handleDelete(p.id)}>ลบ</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={6}>ยังไม่มีสินค้า</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
