import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Loader2, RefreshCw, ExternalLink, CheckCircle,
  AlertTriangle, CreditCard, ClipboardList, Receipt,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getOrdersByStore,
  getStorePaymentRecords,
  createDebtPayment,
} from "../api/authAPI";

const FranchiseDebtPayment = () => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [debtOrders, setDebtOrders]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [payLoading, setPayLoading]         = useState(false);

  const storeInfo = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("franchiseStoreInfo") || "null");
    } catch {
      return null;
    }
  })();
  const storeId   = storeInfo?.storeId   ?? "";
  const storeName = storeInfo?.storeName ?? storeId;

  const fetchData = useCallback(async () => {
    if (!storeId) return;
    try {
      setLoading(true);
      const [recRes, ordRes] = await Promise.allSettled([
        getStorePaymentRecords(storeId),
        getOrdersByStore(storeId),
      ]);

      if (recRes.status === "fulfilled") {
        const r = recRes.value.data?.data ?? recRes.value.data ?? [];
        setPaymentRecords(Array.isArray(r) ? r : []);
      }

      if (ordRes.status === "fulfilled") {
        const all = ordRes.value.data?.data ?? ordRes.value.data ?? [];
        const arr = Array.isArray(all) ? all : [];
        setDebtOrders(
          arr.filter(
            (o) =>
              o.paymentOption === "PAY_AT_THE_END_OF_MONTH" &&
              o.paymentStatus !== "SUCCESS" &&
              o.paymentStatus !== "PAID"
          )
        );
      }
    } catch {
      toast.error("Không thể tải dữ liệu công nợ.");
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unpaidRecords = paymentRecords.filter(
    (r) => r.debtAmount > 0 && r.status !== "PAID" && r.status !== "SUCCESS"
  );
  const totalDebt = unpaidRecords.reduce((sum, r) => sum + (r.debtAmount ?? 0), 0);

  const handlePayDebt = async () => {
    if (!storeId) return;
    try {
      setPayLoading(true);
      const res = await createDebtPayment(storeId);
      const paymentUrl = res.data?.data?.paymentUrl ?? res.data?.paymentUrl;
      if (paymentUrl) {
        window.open(paymentUrl, "_blank");
        toast.success("Đã mở trang thanh toán VNPay.");
      } else {
        toast.error("Không nhận được link thanh toán.");
      }
    } catch (err) {
      console.error("[DebtPayment] error:", err?.response?.status, err?.response?.data);
      const msg = err?.response?.data?.message
        ?? err?.response?.data?.error
        ?? `Tạo link thanh toán thất bại (HTTP ${err?.response?.status ?? "?"}).`;
      toast.error(msg);
    } finally {
      setPayLoading(false);
    }
  };

  if (!storeId) {
    return (
      <div className="animate-fade-in flex items-center justify-center p-12">
        <p className="text-muted-foreground">Không tìm thấy thông tin store.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Thanh toán công nợ</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý và thanh toán nợ cuối tháng cho store <strong>{storeName}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu công nợ...</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="admin-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Tổng nợ chưa thanh toán</p>
                  <p className="text-xl font-bold text-foreground">
                    {totalDebt > 0 ? `${totalDebt.toLocaleString()} VND` : "0 VND"}
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Đơn chưa thanh toán (cuối tháng)</p>
                  <p className="text-xl font-bold text-foreground">{debtOrders.length}</p>
                </div>
              </div>
            </div>

            <div className="admin-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Phiếu nợ</p>
                  <p className="text-xl font-bold text-foreground">{unpaidRecords.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pay debt action */}
          {totalDebt > 0 ? (
            <div className="admin-card rounded-xl p-5 border-l-4 border-l-amber-400">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Store có công nợ: {totalDebt.toLocaleString()} VND
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Thanh toán toàn bộ nợ qua VNPay để tiếp tục đặt hàng bình thường.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePayDebt}
                  disabled={payLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                >
                  {payLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ExternalLink className="w-4 h-4" />
                  }
                  Thanh toán nợ qua VNPay
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-card rounded-xl p-5 border-l-4 border-l-emerald-400">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Không có công nợ</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Store hiện không có nợ nào cần thanh toán.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment records table */}
          {paymentRecords.length > 0 && (
            <div className="admin-card rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">Lịch sử phiếu nợ</h3>
                <span className="badge badge-delivered">{paymentRecords.length} phiếu</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="admin-table-header">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mã phiếu</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số tiền (VND)</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paymentRecords.map((r) => {
                      const isPaid = r.status === "PAID" || r.status === "SUCCESS";
                      return (
                        <tr key={r.paymentRecordId} className="admin-table-row">
                          <td className="px-6 py-4 font-medium text-foreground text-xs">
                            {r.paymentRecordId?.substring(0, 18)}…
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-foreground">
                            {r.debtAmount?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {isPaid
                                ? <CheckCircle className="w-3.5 h-3.5" />
                                : <CreditCard className="w-3.5 h-3.5" />
                              }
                              {r.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {r.createdAt ? new Date(r.createdAt).toLocaleString("vi-VN") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Debt orders table */}
          {debtOrders.length > 0 && (
            <div className="admin-card rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  Đơn hàng chưa thanh toán (Pay At The End Of The Month)
                </h3>
                <span className="badge badge-pending">{debtOrders.length} đơn</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="admin-table-header">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ngày đặt</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái đơn</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thanh toán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {debtOrders.map((o) => (
                      <tr key={o.orderId} className="admin-table-row">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full admin-avatar flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                              <ClipboardList className="w-4 h-4" />
                            </div>
                            <p className="font-medium text-foreground">{o.orderId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{o.orderDate ?? "—"}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            o.statusOrder === "DELIVERED" ? "bg-green-100 text-green-700" :
                            o.statusOrder === "COOKING_DONE" ? "bg-emerald-100 text-emerald-700" :
                            o.statusOrder === "PENDING" ? "bg-amber-100 text-amber-700" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {o.statusOrder ?? "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                            <CreditCard className="w-3.5 h-3.5" />
                            {o.paymentStatus ?? "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {paymentRecords.length === 0 && debtOrders.length === 0 && totalDebt === 0 && (
            <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground">Không có dữ liệu công nợ</p>
              <p className="text-sm text-muted-foreground">
                Store hiện chưa có đơn hàng nào cần thanh toán cuối tháng.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FranchiseDebtPayment;
