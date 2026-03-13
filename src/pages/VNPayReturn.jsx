import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowLeft, CreditCard, Clock } from "lucide-react";
import { getPaymentByTxnRef } from "../api/authAPI";

const VNPayReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  const txnRefParam     = searchParams.get("txnRef") ?? searchParams.get("vnp_TxnRef") ?? "";
  const orderIdParam    = searchParams.get("orderId") ?? "";

  const isVnpDirect = !!vnpResponseCode;

  const [status, setStatus]       = useState(isVnpDirect ? (vnpResponseCode === "00" ? "success" : "failed") : "polling");
  const [payment, setPayment]     = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef(null);

  const vnpAmount    = searchParams.get("vnp_Amount") ?? "0";
  const vnpBankCode  = searchParams.get("vnp_BankCode") ?? "";
  const vnpOrderInfo = searchParams.get("vnp_OrderInfo") ?? "";
  const vnpPayDate   = searchParams.get("vnp_PayDate") ?? "";
  const vnpBankTran  = searchParams.get("vnp_BankTranNo") ?? "";

  const closeVnpayTab = () => {
    try {
      if (window.__vnpayPopup && !window.__vnpayPopup.closed) {
        window.__vnpayPopup.close();
      }
      window.__vnpayPopup = null;
    } catch { /* cross-origin — ignore */ }
  };

  useEffect(() => {
    if (status !== "polling" || !txnRefParam) return;

    const poll = async () => {
      try {
        const res = await getPaymentByTxnRef(txnRefParam);
        const data = res.data?.data ?? res.data;
        if (data) {
          setPayment(data);
          if (data.status === "SUCCESS" || data.status === "PAID") {
            setStatus("success");
            clearInterval(intervalRef.current);
            closeVnpayTab();
          } else if (data.status === "FAILED" || data.status === "CANCELLED" || data.status === "EXPIRED") {
            setStatus("failed");
            clearInterval(intervalRef.current);
            closeVnpayTab();
          }
        }
      } catch {
        // keep polling
      }
      setPollCount((c) => c + 1);
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => clearInterval(intervalRef.current);
  }, [status, txnRefParam]);

  useEffect(() => {
    if (pollCount >= 60 && status === "polling") {
      setStatus("timeout");
      clearInterval(intervalRef.current);
    }
  }, [pollCount, status]);

  const goBack = () => {
    closeVnpayTab();
    const role = sessionStorage.getItem("role");
    if (role === "FRANCHISE_STAFF") navigate("/franchiseStaff");
    else navigate("/");
  };

  const displayAmount = isVnpDirect
    ? (Number(vnpAmount) / 100).toLocaleString("vi-VN")
    : payment?.amount?.toLocaleString("vi-VN") ?? "—";

  const displayTxnRef   = txnRefParam;
  const displayBankCode = isVnpDirect ? vnpBankCode : (payment?.bankCode ?? "—");
  const displayBankTran = isVnpDirect ? vnpBankTran : (payment?.bankTranNo ?? "—");
  const displayOrderInfo = isVnpDirect
    ? vnpOrderInfo
    : (orderIdParam || "—");
  const displayCardType = payment?.cardType ?? "—";
  const displayPaidAt   = isVnpDirect
    ? (vnpPayDate
        ? `${vnpPayDate.slice(0,4)}-${vnpPayDate.slice(4,6)}-${vnpPayDate.slice(6,8)} ${vnpPayDate.slice(8,10)}:${vnpPayDate.slice(10,12)}:${vnpPayDate.slice(12,14)}`
        : "—")
    : (payment?.paidAt?.replace("T", " ").slice(0, 19) ?? "—");

  /* ── Polling state ── */
  if (status === "polling") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md admin-card rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-10 text-center bg-blue-50">
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4 animate-pulse">
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-blue-700">Đang chờ thanh toán...</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Vui lòng hoàn tất thanh toán trên trang VNPay ở tab mới.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang kiểm tra trạng thái... ({pollCount})</span>
            </div>
          </div>

          <div className="px-8 py-6 space-y-3">
            <DetailRow label="Mã giao dịch" value={txnRefParam || "—"} />
            {orderIdParam && <DetailRow label="Đơn hàng" value={orderIdParam} />}
          </div>

          <div className="px-8 pb-8">
            <button
              onClick={goBack}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-muted/60 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Quay về (hủy chờ)
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Timeout state ── */
  if (status === "timeout") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md admin-card rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-8 text-center bg-amber-50">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-amber-700">Hết thời gian chờ</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Chưa nhận được kết quả thanh toán. Vui lòng kiểm tra lại trong danh sách đơn hàng.
            </p>
          </div>
          <div className="px-8 py-6 space-y-3">
            <DetailRow label="Mã giao dịch" value={txnRefParam || "—"} />
            {orderIdParam && <DetailRow label="Đơn hàng" value={orderIdParam} />}
          </div>
          <div className="px-8 pb-8">
            <button
              onClick={goBack}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Quay về
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success / Failed state ── */
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md admin-card rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className={`px-8 py-8 text-center ${isSuccess ? "bg-emerald-50" : "bg-red-50"}`}>
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isSuccess ? "bg-emerald-100" : "bg-red-100"}`}>
            {isSuccess
              ? <CheckCircle className="w-10 h-10 text-emerald-600" />
              : <XCircle className="w-10 h-10 text-red-500" />
            }
          </div>
          <h1 className={`text-2xl font-bold ${isSuccess ? "text-emerald-700" : "text-red-600"}`}>
            {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isSuccess
              ? "Giao dịch đã được xử lý thành công qua VNPay."
              : isVnpDirect
                ? `Mã lỗi: ${vnpResponseCode}. Vui lòng thử lại hoặc liên hệ hỗ trợ.`
                : `Trạng thái: ${payment?.status ?? "FAILED"}. Vui lòng thử lại.`
            }
          </p>
        </div>

        {/* Detail */}
        <div className="px-8 py-6 space-y-3">
          <DetailRow label="Mã giao dịch"    value={displayTxnRef || "—"} />
          <DetailRow label="Số tiền"          value={`${displayAmount} VND`} highlight />
          <DetailRow label="Ngân hàng"        value={displayBankCode} />
          <DetailRow label="Mã GD ngân hàng"  value={displayBankTran} />
          <DetailRow label="Loại thẻ"         value={displayCardType} />
          <DetailRow label="Nội dung"         value={displayOrderInfo} />
          <DetailRow label="Thời gian"        value={displayPaidAt} />
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex gap-3">
          <button
            onClick={goBack}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-muted/60 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Quay về
          </button>
          {!isSuccess && (
            <button
              onClick={goBack}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
            >
              <CreditCard className="w-4 h-4" /> Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-medium text-right max-w-[60%] break-all ${highlight ? "text-primary text-base" : "text-foreground"}`}>
      {value}
    </span>
  </div>
);

export default VNPayReturn;
