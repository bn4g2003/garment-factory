"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface FinanceOverview {
  summary: {
    total_income: number;
    total_expense: number;
    net_profit: number;
    income_count: number;
    expense_count: number;
  };
  storeTransactions: Array<{
    store_code: string;
    store_name: string;
    income: number;
    expense: number;
    profit: number;
  }>;
  factoryTransactions: {
    income: number;
    expense: number;
    profit: number;
  };
  paymentMethods: Array<{
    payment_method: string;
    transaction_type: string;
    count: number;
    total_amount: number;
  }>;
  dailyTransactions: Array<{
    date: string;
    income: number;
    expense: number;
    profit: number;
  }>;
  customerDebt: Array<{
    code: string;
    name: string;
    phone: string;
    debt: number;
    order_count: number;
    order_debt: number;
  }>;
  supplierDebt: Array<{
    code: string;
    name: string;
    phone: string;
    debt: number;
  }>;
}

interface Transaction {
  id: string;
  transaction_code: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  description: string;
  store_id?: string;
  store_name?: string;
  created_by_name: string;
  transaction_date: string;
  status: string;
}

export default function FinancePage() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">(
    "overview"
  );
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [transactionFilters, setTransactionFilters] = useState({
    type: "",
    storeId: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [formData, setFormData] = useState({
    transaction_type: "thu",
    amount: 0,
    payment_method: "cash",
    description: "",
    store_id: "",
    created_by: "1",
  });
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const overviewUrl =
        dateRange.startDate && dateRange.endDate
          ? `/api/finance/overview?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
          : "/api/finance/overview";

      const transactionUrl = new URL(
        "/api/finance/transactions",
        window.location.origin
      );
      if (transactionFilters.type)
        transactionUrl.searchParams.set("type", transactionFilters.type);
      if (transactionFilters.storeId)
        transactionUrl.searchParams.set("storeId", transactionFilters.storeId);

      const [overviewRes, transactionsRes] = await Promise.all([
        fetch(overviewUrl),
        fetch(transactionUrl.toString()),
      ]);

      const overviewData = await overviewRes.json();
      const transactionsData = await transactionsRes.json();

      if (overviewData.success) {
        setOverview(overviewData.data);
      }
      if (transactionsData.success) {
        setTransactions(transactionsData.transactions);
      }
    } catch (error) {
      console.error("Error fetching finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Có lỗi xảy ra");
        return;
      }

      alert("Thêm giao dịch thành công!");
      setShowForm(false);
      setFormData({
        transaction_type: "thu",
        amount: 0,
        payment_method: "cash",
        description: "",
        store_id: "",
        created_by: "1",
      });
      await fetchData();
    } catch (error) {
      alert("Có lỗi xảy ra khi thêm giao dịch");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPDFReport = async () => {
    try {
      setDownloadingPDF(true);

      const reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Báo Cáo Tài Chính</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 25px; color: #333; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 35px; border-bottom: 3px solid #2c5aa0; padding-bottom: 15px; }
            .header h1 { margin: 0; color: #2c5aa0; font-size: 28px; font-weight: bold; }
            .header .date { color: #666; font-size: 14px; margin-top: 8px; }
            .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 35px; }
            .summary-card { border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; background: #fafafa; }
            .summary-card.income { border-left: 5px solid #28a745; }
            .summary-card.expense { border-left: 5px solid #dc3545; }
            .summary-card.profit { border-left: 5px solid #007bff; }
            .summary-card.factory { border-left: 5px solid #ffc107; }
            .summary-value { font-size: 20px; font-weight: bold; margin: 8px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 13px; }
            .table th, .table td { border: 1px solid #dee2e6; padding: 10px; text-align: left; }
            .table th { background-color: #f8f9fa; font-weight: bold; color: #495057; }
            .positive { color: #28a745; font-weight: bold; }
            .negative { color: #dc3545; font-weight: bold; }
            .section { margin-bottom: 35px; }
            .section-title { background-color: #e9ecef; padding: 12px 15px; border-left: 5px solid #2c5aa0; margin-bottom: 18px; font-weight: bold; color: #495057; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BÁO CÁO TÀI CHÍNH</h1>
            <div class="date">Ngày xuất báo cáo: ${new Date().toLocaleDateString(
              "vi-VN"
            )}</div>
            ${
              dateRange.startDate && dateRange.endDate
                ? `<div class="date">Thời gian: ${new Date(
                    dateRange.startDate
                  ).toLocaleDateString("vi-VN")} - ${new Date(
                    dateRange.endDate
                  ).toLocaleDateString("vi-VN")}</div>`
                : ""
            }
          </div>

          ${
            overview
              ? `
          <div class="section">
            <div class="section-title">TỔNG QUAN TÀI CHÍNH</div>
            <div class="summary">
              <div class="summary-card income">
                <div style="font-weight: bold; color: #495057;">TỔNG THU</div>
                <div class="summary-value positive">${formatCurrency(
                  overview.summary.total_income
                )}</div>
                <div style="color: #6c757d;">${
                  overview.summary.income_count
                } giao dịch</div>
              </div>
              <div class="summary-card expense">
                <div style="font-weight: bold; color: #495057;">TỔNG CHI</div>
                <div class="summary-value negative">${formatCurrency(
                  overview.summary.total_expense
                )}</div>
                <div style="color: #6c757d;">${
                  overview.summary.expense_count
                } giao dịch</div>
              </div>
              <div class="summary-card profit">
                <div style="font-weight: bold; color: #495057;">LỢI NHUẬN</div>
                <div class="summary-value ${
                  overview.summary.net_profit >= 0 ? "positive" : "negative"
                }">
                  ${formatCurrency(overview.summary.net_profit)}
                </div>
              </div>
              <div class="summary-card factory">
                <div style="font-weight: bold; color: #495057;">XƯỞNG SẢN XUẤT</div>
                <div class="summary-value ${
                  overview.factoryTransactions.profit >= 0
                    ? "positive"
                    : "negative"
                }">
                  ${formatCurrency(overview.factoryTransactions.profit)}
                </div>
                <div style="color: #6c757d;">Thu: ${formatCurrency(
                  overview.factoryTransactions.income
                )}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">THU CHI THEO CỬA HÀNG</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Cửa Hàng</th>
                  <th>Mã</th>
                  <th class="text-right">Thu</th>
                  <th class="text-right">Chi</th>
                  <th class="text-right">Lợi Nhuận</th>
                </tr>
              </thead>
              <tbody>
                ${overview.storeTransactions
                  .map(
                    (store) => `
                  <tr>
                    <td>${store.store_name}</td>
                    <td>${store.store_code}</td>
                    <td class="text-right positive">${formatCurrency(
                      store.income
                    )}</td>
                    <td class="text-right negative">${formatCurrency(
                      store.expense
                    )}</td>
                    <td class="text-right ${
                      store.profit >= 0 ? "positive" : "negative"
                    }">${formatCurrency(store.profit)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          ${
            overview.customerDebt.length > 0
              ? `
          <div class="section">
            <div class="section-title">CÔNG NỢ KHÁCH HÀNG</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Khách Hàng</th>
                  <th>Số điện thoại</th>
                  <th class="text-center">Số đơn hàng</th>
                  <th class="text-right">Tổng nợ</th>
                </tr>
              </thead>
              <tbody>
                ${overview.customerDebt
                  .map(
                    (customer) => `
                  <tr>
                    <td>${customer.name}</td>
                    <td>${customer.phone}</td>
                    <td class="text-center">${customer.order_count}</td>
                    <td class="text-right negative">${formatCurrency(
                      customer.debt + customer.order_debt
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            overview.supplierDebt.length > 0
              ? `
          <div class="section">
            <div class="section-title">CÔNG NỢ NHÀ CUNG CẤP</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Nhà cung cấp</th>
                  <th>Số điện thoại</th>
                  <th class="text-right">Tổng nợ</th>
                </tr>
              </thead>
              <tbody>
                ${overview.supplierDebt
                  .map(
                    (supplier) => `
                  <tr>
                    <td>${supplier.name}</td>
                    <td>${supplier.phone}</td>
                    <td class="text-right negative">${formatCurrency(
                      supplier.debt
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }
          `
              : ""
          }

          ${
            transactions.length > 0
              ? `
          <div class="section">
            <div class="section-title">LỊCH SỬ GIAO DỊCH (${
              transactions.length
            } giao dịch)</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Mã giao dịch</th>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th class="text-right">Số tiền</th>
                  <th>Phương thức</th>
                  <th>Cửa hàng</th>
                  <th>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                ${transactions
                  .map(
                    (transaction) => `
                  <tr>
                    <td>${transaction.transaction_code}</td>
                    <td>${formatDate(transaction.transaction_date)}</td>
                    <td>${
                      transaction.transaction_type === "thu" ? "THU" : "CHI"
                    }</td>
                    <td class="text-right ${
                      transaction.transaction_type === "thu"
                        ? "positive"
                        : "negative"
                    }">
                      ${
                        transaction.transaction_type === "thu" ? "+" : "-"
                      }${formatCurrency(transaction.amount)}
                    </td>
                    <td>${transaction.payment_method}</td>
                    <td>${transaction.store_name || "Xưởng"}</td>
                    <td>${transaction.description}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }
        </body>
        </html>
      `;

      const blob = new Blob([reportContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao-cao-tai-chinh-${
        new Date().toISOString().split("T")[0]
      }.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("Đã tải xuống báo cáo thành công!");
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Có lỗi xảy ra khi tải báo cáo");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700 font-medium">
            Đang tải dữ liệu tài chính...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span className="text-gray-600">←</span>
              <span className="font-medium text-gray-700">Quay lại</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Báo Cáo Tài Chính
              </h1>
              <p className="text-gray-600 mt-2">
                Quản lý và theo dõi tình hình tài chính toàn hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={downloadPDFReport}
              disabled={downloadingPDF}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <span className="font-medium">
                {downloadingPDF ? "Đang tải..." : "Tải báo cáo"}
              </span>
            </button>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-lg font-medium"
            >
              <span className="font-medium">Thêm Giao Dịch</span>
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-1 inline-flex">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Tổng Quan
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "transactions"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Giao Dịch
          </button>
        </div>
      </div>

      {/* FORM THÊM GIAO DỊCH */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Thêm Giao Dịch Thu/Chi
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-xl text-gray-500">×</span>
            </button>
          </div>

          <form
            onSubmit={handleAddTransaction}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Loại Giao Dịch *
              </label>
              <select
                value={formData.transaction_type}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_type: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="thu">Thu tiền</option>
                <option value="chi">Chi tiền</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Số Tiền (VND) *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                min="0"
                placeholder="Nhập số tiền"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Phương Thức Thanh Toán *
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData({ ...formData, payment_method: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="cash">Tiền mặt</option>
                <option value="bank">Chuyển khoản</option>
                <option value="card">Thẻ</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Cửa Hàng (Nếu có)
              </label>
              <input
                type="text"
                value={formData.store_id}
                onChange={(e) =>
                  setFormData({ ...formData, store_id: e.target.value })
                }
                placeholder="ID cửa hàng"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Mô Tả Giao Dịch
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                rows={4}
                placeholder="Mô tả chi tiết giao dịch..."
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-all shadow-lg"
              >
                {submitting ? "Đang xử lý..." : "Lưu Giao Dịch"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: TỔNG QUAN TÀI CHÍNH */}
      {activeTab === "overview" && overview && (
        <div className="space-y-8">
          {/* BỘ LỌC THỜI GIAN */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Lọc Theo Thời Gian
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <button
                onClick={fetchData}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow h-12"
              >
                Áp dụng
              </button>
              <button
                onClick={() => {
                  setDateRange({ startDate: "", endDate: "" });
                  fetchData();
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-semibold shadow h-12"
              >
                Xóa lọc
              </button>
              <div className="text-sm text-gray-500">
                {dateRange.startDate && dateRange.endDate
                  ? `Đang xem: ${formatDate(
                      dateRange.startDate
                    )} - ${formatDate(dateRange.endDate)}`
                  : "Xem tất cả dữ liệu"}
              </div>
            </div>
          </div>

          {/* TỔNG QUAN CHÍNH */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow border border-green-200 p-6">
              <div className="text-sm font-bold text-green-800 uppercase mb-4">
                TỔNG THU
              </div>
              <div className="text-3xl font-bold text-green-700 mb-2">
                {formatCurrency(overview.summary.total_income)}
              </div>
              <div className="text-sm text-green-600">
                {overview.summary.income_count} giao dịch
              </div>
            </div>

            <div className="bg-white rounded-xl shadow border border-red-200 p-6">
              <div className="text-sm font-bold text-red-800 uppercase mb-4">
                TỔNG CHI
              </div>
              <div className="text-3xl font-bold text-red-700 mb-2">
                {formatCurrency(overview.summary.total_expense)}
              </div>
              <div className="text-sm text-red-600">
                {overview.summary.expense_count} giao dịch
              </div>
            </div>

            <div
              className={`bg-white rounded-xl shadow border p-6 ${
                overview.summary.net_profit >= 0
                  ? "border-blue-200"
                  : "border-orange-200"
              }`}
            >
              <div
                className={`text-sm font-bold uppercase mb-4 ${
                  overview.summary.net_profit >= 0
                    ? "text-blue-800"
                    : "text-orange-800"
                }`}
              >
                LỢI NHUẬN
              </div>
              <div
                className={`text-3xl font-bold mb-2 ${
                  overview.summary.net_profit >= 0
                    ? "text-blue-700"
                    : "text-orange-700"
                }`}
              >
                {formatCurrency(overview.summary.net_profit)}
              </div>
              <div
                className={`text-sm ${
                  overview.summary.net_profit >= 0
                    ? "text-blue-600"
                    : "text-orange-600"
                }`}
              >
                {overview.summary.net_profit >= 0 ? "Lãi" : "Lỗ"}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow border border-yellow-200 p-6">
              <div className="text-sm font-bold text-yellow-800 uppercase mb-4">
                XƯỞNG SẢN XUẤT
              </div>
              <div className="text-3xl font-bold text-yellow-700 mb-2">
                {formatCurrency(overview.factoryTransactions.profit)}
              </div>
              <div className="text-sm text-yellow-600">
                Thu: {formatCurrency(overview.factoryTransactions.income)}
              </div>
            </div>
          </div>

          {/* THU CHI THEO CỬA HÀNG */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-800 p-6">
              <h3 className="text-xl font-bold text-white">
                Thu Chi Theo Cửa Hàng
              </h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                        Cửa Hàng
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                        Mã
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">
                        Thu
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">
                        Chi
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">
                        Lợi Nhuận
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {overview.storeTransactions.map((store) => (
                      <tr
                        key={store.store_code}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {store.store_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {store.store_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                          +{formatCurrency(store.income)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">
                          -{formatCurrency(store.expense)}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                            store.profit >= 0
                              ? "text-blue-600"
                              : "text-orange-600"
                          }`}
                        >
                          {formatCurrency(store.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CÔNG NỢ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CÔNG NỢ KHÁCH HÀNG */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <div className="bg-gray-800 p-6">
                <h3 className="text-xl font-bold text-white">
                  Công Nợ Khách Hàng
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {overview.customerDebt.map((customer) => (
                    <div
                      key={customer.code}
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-lg">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {customer.phone} • {customer.code}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {customer.order_count} đơn hàng
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-600 font-bold text-xl">
                          {formatCurrency(customer.debt + customer.order_debt)}
                        </div>
                        <div className="text-sm text-red-500">Nợ</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CÔNG NỢ NHÀ CUNG CẤP */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <div className="bg-gray-800 p-6">
                <h3 className="text-xl font-bold text-white">
                  Công Nợ Nhà Cung Cấp
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {overview.supplierDebt.map((supplier) => (
                    <div
                      key={supplier.code}
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-lg">
                          {supplier.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {supplier.phone} • {supplier.code}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-600 font-bold text-xl">
                          {formatCurrency(supplier.debt)}
                        </div>
                        <div className="text-sm text-red-500">Nợ</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: QUẢN LÝ GIAO DỊCH */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="bg-gray-800 p-6">
            <h3 className="text-xl font-bold text-white">Quản Lý Giao Dịch</h3>
          </div>

          {/* BỘ LỌC GIAO DỊCH */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <select
                value={transactionFilters.type}
                onChange={(e) =>
                  setTransactionFilters({
                    ...transactionFilters,
                    type: e.target.value,
                  })
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Tất cả loại</option>
                <option value="thu">Thu tiền</option>
                <option value="chi">Chi tiền</option>
              </select>

              <input
                type="text"
                value={transactionFilters.storeId}
                onChange={(e) =>
                  setTransactionFilters({
                    ...transactionFilters,
                    storeId: e.target.value,
                  })
                }
                placeholder="Lọc theo ID cửa hàng"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />

              <button
                onClick={fetchData}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow"
              >
                Lọc
              </button>

              <button
                onClick={() => {
                  setTransactionFilters({ type: "", storeId: "" });
                  fetchData();
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-semibold shadow"
              >
                Xóa lọc
              </button>

              <div className="text-sm text-gray-600 flex items-center justify-center">
                {transactions.length} giao dịch
              </div>
            </div>
          </div>

          {/* DANH SÁCH GIAO DỊCH */}
          <div className="p-6">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      Mã GD
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      Ngày
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      Loại
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      Số Tiền
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      Phương Thức
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      Cửa Hàng
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      Người Tạo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                      Mô Tả
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {transaction.transaction_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            transaction.transaction_type === "thu"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {transaction.transaction_type === "thu"
                            ? "THU"
                            : "CHI"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                        <span
                          className={
                            transaction.transaction_type === "thu"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.transaction_type === "thu" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {transaction.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transaction.store_name || "Xưởng"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transaction.created_by_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        {transaction.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {transactions.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-xl text-gray-500 font-semibold">
                    Không có giao dịch nào
                  </div>
                  <div className="text-gray-400 mt-2">
                    Hãy thêm giao dịch đầu tiên!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
