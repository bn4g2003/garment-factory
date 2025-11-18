"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_code: string;
  customer_phone: string;
  order_type: string;
  total_amount: number;
  debt_amount: number;
  status: string;
  created_at: string;
  created_by_name: string;
}

interface OrderItem {
  id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  price: number;
  total_amount: number;
}

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    fetchOrderDetail();
  }, [router, orderId]);

  const fetchOrderDetail = async () => {
    try {
      //       const res = await fetch(
      //   `/api/stores/customer-orders/${orderId}`
      // );
      // const data = await res.json();

      // MOCK DATA - API endpoint is not ready yet
      const mockOrder: Order = {
        id: orderId,
        order_code: `SCO-${orderId.substring(0, 8).toUpperCase()}`,
        customer_name: "Khách hàng Mẫu",
        customer_code: "KH-007",
        customer_phone: "0987654321",
        order_type: "Đơn hàng tại cửa hàng",
        total_amount: 3500000,
        debt_amount: 500000,
        status: "pending",
        created_at: new Date().toISOString(),
        created_by_name: "Nhân viên Bán hàng",
      };
      // if (data.success) {
      //   setOrder(data.order);
      //   setItems(data.items);
      // }

      const mockItems: OrderItem[] = [
        {
          id: "1",
          product_code: "P-001",
          product_name: "Áo Thun Cổ Tròn",
          quantity: 10,
          price: 150000,
          total_amount: 1500000,
        },
        {
          id: "2",
          product_code: "P-002",
          product_name: "Quần Jeans Nam",
          quantity: 5,
          price: 400000,
          total_amount: 2000000,
        },
      ];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setOrder(mockOrder);
      setItems(mockItems);
    } catch (error) {
      console.error("Error fetching order detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const convertNumberToWords = (num: number): string => {
    if (num === 0) return "Không";

    const ones = [
      "",
      "một",
      "hai",
      "ba",
      "bốn",
      "năm",
      "sáu",
      "bảy",
      "tám",
      "chín",
    ];
    const tens = [
      "",
      "mười",
      "hai mươi",
      "ba mươi",
      "bốn mươi",
      "năm mươi",
      "sáu mươi",
      "bảy mươi",
      "tám mươi",
      "chín mươi",
    ];

    if (num < 10) return ones[num];
    if (num < 20) return tens[1] + " " + ones[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one ? " " + ones[one] : "");
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      return (
        ones[hundred] + " trăm" + (rest ? " " + convertNumberToWords(rest) : "")
      );
    }
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const rest = num % 1000;
      return (
        convertNumberToWords(thousand) +
        " nghìn" +
        (rest ? " " + convertNumberToWords(rest) : "")
      );
    }

    const million = Math.floor(num / 1000000);
    const rest = num % 1000000;
    return (
      convertNumberToWords(million) +
      " triệu" +
      (rest ? " " + convertNumberToWords(rest) : "")
    );
  };

  const handleExportPDF = () => {
    if (!order) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHTML = items
      .map(
        (item, index) => `
      <tr>
        <td style="text-align: center; padding: 10px; border: 1px solid #000;">${
          index + 1
        }</td>
        <td style="padding: 10px; border: 1px solid #000;">${
          item.product_code
        }</td>
        <td style="padding: 10px; border: 1px solid #000;">${
          item.product_name
        }</td>
        <td style="text-align: center; padding: 10px; border: 1px solid #000;">${
          item.quantity
        }</td>
        <td style="text-align: right; padding: 10px; border: 1px solid #000;">${item.price.toLocaleString()}</td>
        <td style="text-align: right; padding: 10px; border: 1px solid #000; font-weight: bold;">${item.total_amount.toLocaleString()}</td>
      </tr>
    `
      )
      .join("");

    const totalInWords = convertNumberToWords(
      Math.floor(order.total_amount / 1000)
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Đơn hàng ${order.order_code}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Times New Roman', Times, serif; 
              font-size: 14px;
              line-height: 1.5;
              color: #000;
              padding: 30px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 3px solid #000;
            }
            .company-info { flex: 1; }
            .company-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; text-transform: uppercase; }
            .title {
              text-align: center;
              margin: 30px 0;
            }
            .title h1 {
              font-size: 24px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 10px;
            }
            .title .order-code {
              font-size: 15px;
              font-style: italic;
            }
            .info-section {
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              width: 180px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 25px 0;
            }
            th {
              background-color: #e5e7eb;
              font-weight: bold;
              text-align: center;
              padding: 12px;
              border: 1px solid #000;
            }
            .total-section {
              margin: 25px 0;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 8px;
              font-size: 15px;
            }
            .total-label {
              font-weight: bold;
              width: 180px;
              text-align: right;
              margin-right: 30px;
            }
            .total-value {
              width: 180px;
              text-align: right;
              font-weight: bold;
            }
            .total-words {
              margin-top: 15px;
              font-style: italic;
              text-align: left;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              text-align: center;
              width: 30%;
            }
            .signature-title {
              font-weight: bold;
              margin-bottom: 70px;
            }
            .signature-name {
              font-size: 12px;
              font-style: italic;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <div class="company-name">XƯỞNG MAY [TÊN CÔNG TY]</div>
              <div>Địa chỉ: [Địa chỉ xưởng]</div>
              <div>Điện thoại: [Số điện thoại]</div>
              <div>Email: [Email]</div>
            </div>
            <div style="text-align: right;">
              <div><strong>Ngày:</strong> ${new Date(
                order.created_at
              ).toLocaleDateString("vi-VN")}</div>
              <div><strong>Số:</strong> ${order.order_code}</div>
            </div>
          </div>

          <div class="title">
            <h1>Đơn Hàng</h1>
            <div class="order-code">Mã đơn hàng: ${order.order_code}</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Khách hàng:</span>
              <span><strong>${order.customer_name}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Mã khách hàng:</span>
              <span>${order.customer_code}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Số điện thoại:</span>
              <span>${order.customer_phone || "-"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Loại đơn hàng:</span>
              <span>${order.order_type}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px;">STT</th>
                <th style="width: 120px;">Mã SP</th>
                <th>Tên sản phẩm</th>
                <th style="width: 90px;">Số lượng</th>
                <th style="width: 120px;">Đơn giá (đ)</th>
                <th style="width: 140px;">Thành tiền (đ)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Tổng cộng:</span>
              <span class="total-value">${order.total_amount.toLocaleString()} đ</span>
            </div>
            ${
              order.debt_amount > 0
                ? `
            <div class="total-row" style="color: #dc2626;">
              <span class="total-label">Công nợ:</span>
              <span class="total-value">${order.debt_amount.toLocaleString()} đ</span>
            </div>
            `
                : ""
            }
            <div class="total-words">
              <strong>Bằng chữ:</strong> ${totalInWords} nghìn đồng chẵn
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-title">Người lập phiếu</div>
              <div class="signature-name">(Ký, ghi rõ họ tên)</div>
            </div>
            <div class="signature-box">
              <div class="signature-title">Khách hàng</div>
              <div class="signature-name">(Ký, ghi rõ họ tên)</div>
            </div>
            <div class="signature-box">
              <div class="signature-title">Giám đốc</div>
              <div class="signature-name">(Ký, ghi rõ họ tên)</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    };
    const labels: Record<string, string> = {
      pending: "Chờ xử lý",
      in_progress: "Đang thực hiện",
      completed: "Hoàn thành",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          badges[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Đang tải...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Không tìm thấy đơn hàng</div>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Link
          href="/admin/store/customer-orders"
          className="text-blue-600 hover:text-blue-900"
        >
          ← Quay lại danh sách
        </Link>
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          📄 Xuất đơn hàng (PDF)
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">ĐƠN HÀNG</h1>
          <p className="text-lg text-gray-600 mt-2">
            Mã đơn: {order.order_code}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Thông tin khách hàng
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="font-medium w-32">Mã KH:</span>
                <span className="text-gray-900">{order.customer_code}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Tên KH:</span>
                <span className="text-gray-900">{order.customer_name}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Số điện thoại:</span>
                <span className="text-gray-900">
                  {order.customer_phone || "-"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Thông tin đơn hàng
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="font-medium w-32">Loại đơn:</span>
                <span className="text-gray-900">{order.order_type}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Ngày tạo:</span>
                <span className="text-gray-900">
                  {new Date(order.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Người tạo:</span>
                <span className="text-gray-900">{order.created_by_name}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Trạng thái:</span>
                <span>{getStatusBadge(order.status)}</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-4 text-lg">
          Chi tiết sản phẩm
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                STT
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Mã SP
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tên sản phẩm
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Số lượng
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Đơn giá
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {item.product_code}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {item.product_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {item.price.toLocaleString()}đ
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                  {item.total_amount.toLocaleString()}đ
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td
                colSpan={5}
                className="px-4 py-3 text-right font-bold text-gray-900"
              >
                Tổng cộng:
              </td>
              <td className="px-4 py-3 text-right font-bold text-lg text-gray-900">
                {order.total_amount.toLocaleString()}đ
              </td>
            </tr>
            {order.debt_amount > 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-3 text-right font-bold text-red-600"
                >
                  Công nợ:
                </td>
                <td className="px-4 py-3 text-right font-bold text-lg text-red-600">
                  {order.debt_amount.toLocaleString()}đ
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </main>
  );
}
