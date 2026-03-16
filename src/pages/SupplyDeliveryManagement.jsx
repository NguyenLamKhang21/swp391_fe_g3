import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getProvinceId, getDistrictAddress, getWardAddress, getAllOrders } from "../api/authAPI";
import { MapPin, Eye, X, Package, FileText } from "lucide-react";

const SupplyDeliveryManagement = () => {
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
    
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [districtError, setDistrictError] = useState(null);

  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState("");
  const [loadingWards, setLoadingWards] = useState(false);
  const [wardError, setWardError] = useState(null);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const openOrderDetail = (order) => setSelectedOrder(order);
  const closeModal = () => setSelectedOrder(null);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getProvinceId();
        // Assuming the response template given has data directly or nested in data
        const data = response?.data?.data || response?.data || [];
        setProvinces(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching provinces:", err);
        setError("Không thể tải danh sách tỉnh/thành phố.");
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedProvince) {
        setDistricts([]);
        setSelectedDistrict("");
        return;
      }
      setLoadingDistricts(true);
      setDistrictError(null);
      try {
        const provinceIdInt = parseInt(selectedProvince, 10);
        const response = await getDistrictAddress(provinceIdInt);
        const data = response?.data?.data || response?.data || [];
        setDistricts(Array.isArray(data) ? data : []);
        setSelectedDistrict(""); // Reset selected district when province changes
      } catch (err) {
        console.error("Error fetching districts:", err);
        setDistrictError("Không thể tải danh sách quận/huyện.");
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedProvince]);

  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedDistrict) {
        setWards([]);
        setSelectedWard("");
        return;
      }
      setLoadingWards(true);
      setWardError(null);
      try {
        const districtIdInt = parseInt(selectedDistrict, 10);
        const response = await getWardAddress(districtIdInt);
        const data = response?.data?.data || response?.data || [];
        setWards(Array.isArray(data) ? data : []);
        setSelectedWard(""); // Reset selected ward when district changes
      } catch (err) {
        console.error("Error fetching wards:", err);
        setWardError("Không thể tải danh sách phường/xã.");
      } finally {
        setLoadingWards(false);
      }
    };

    fetchWards();
  }, [selectedDistrict]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      setOrdersError(null);
      try {
        const response = await getAllOrders();
        const data = response?.data?.data || response?.data || [];
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrdersError("Không thể tải danh sách đơn hàng.");
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="admin-card rounded-2xl p-6 bg-card border border-border shadow-sm">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6 border-b border-border pb-4">
          <MapPin className="w-6 h-6 text-primary" />
          Quản lý Giao hàng & Cung ứng
        </h2>

        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <label htmlFor="province" className="text-sm font-medium text-foreground">
              Tỉnh / Thành phố
            </label>
            <div className="relative">
              <select
                id="province"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                disabled={loading}
                className="w-full appearance-none bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <option value="">-- Chọn Tỉnh/Thành phố --</option>
                {provinces.map((province) => (
                  <option key={province.ProvinceID} value={province.ProvinceID}>
                    {province.ProvinceName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {loading && (
              <p className="text-xs text-primary mt-1">Đang tải danh sách tỉnh/thành phố...</p>
            )}
            {error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="district" className="text-sm font-medium text-foreground">
              Quận / Huyện
            </label>
            <div className="relative">
              <select
                id="district"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={loadingDistricts || !selectedProvince}
                className="w-full appearance-none bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <option value="">-- Chọn Quận/Huyện --</option>
                {districts.map((district) => (
                  <option key={district.DistrictID} value={district.DistrictID}>
                    {district.DistrictName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {loadingDistricts && (
              <p className="text-xs text-primary mt-1">Đang tải danh sách quận/huyện...</p>
            )}
            {districtError && (
              <p className="text-xs text-destructive mt-1">{districtError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="ward" className="text-sm font-medium text-foreground">
              Phường / Xã
            </label>
            <div className="relative">
              <select
                id="ward"
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                disabled={loadingWards || !selectedDistrict}
                className="w-full appearance-none bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <option value="">-- Chọn Phường/Xã --</option>
                {wards.map((ward, index) => {
                  // Fallback for different possible keys in the Ward API model
                  const wValue = ward.WardCode || ward.WardID || ward.Code || ward.Id || index;
                  const wLabel = ward.WardName || ward.Name || ward.Title || `Phường/Xã ${index}`;
                  return (
                    <option key={wValue} value={wValue}>
                      {wLabel}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {loadingWards && (
              <p className="text-xs text-primary mt-1">Đang tải danh sách phường/xã...</p>
            )}
            {wardError && (
              <p className="text-xs text-destructive mt-1">{wardError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table Section */}
      <div className="admin-card rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Danh sách Đơn hàng</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng hợp thông tin các trạng thái đơn hàng và thanh toán.
          </p>
        </div>

        {loadingOrders ? (
          <div className="p-8 text-center text-primary h-40 flex items-center justify-center">
            Đang tải dữ liệu đơn hàng...
          </div>
        ) : ordersError ? (
          <div className="p-8 text-center text-destructive h-40 flex items-center justify-center">
            {ordersError}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="admin-table-header bg-muted/40 text-muted-foreground uppercase tracking-wider text-xs">
                  <th className="px-6 py-4 text-left font-semibold">Mã đơn (orderId)</th>
                  <th className="px-6 py-4 text-left font-semibold">Độ ưu tiên (priorityLevel)</th>
                  <th className="px-6 py-4 text-left font-semibold">Trạng thái (statusOrder)</th>
                  <th className="px-6 py-4 text-left font-semibold">Tùy chọn thanh toán (paymentOption)</th>
                  <th className="px-6 py-4 text-left font-semibold">Thanh toán (paymentStatus)</th>
                  <th className="px-6 py-4 text-left font-semibold">Ngày tạo (orderDate)</th>
                  <th className="px-6 py-4 text-center font-semibold text-primary">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                      Không có đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.orderId} className="admin-table-row hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-primary">
                        {order.orderId || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {order.priorityLevel || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.statusOrder === "PENDING" ? "bg-amber-100 text-amber-700" :
                          order.statusOrder === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                          order.statusOrder === "CANCELLED" ? "bg-red-100 text-red-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {order.statusOrder || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {order.paymentOption || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.paymentStatus === "PENDING" ? "bg-amber-100 text-amber-700" :
                          order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {order.paymentStatus || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {order.orderDate ? new Date(order.orderDate).toLocaleString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openOrderDetail(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in">
            {/* Modal header */}
            <div className="flex-shrink-0 px-5 py-3 border-b border-border flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Chi tiết — {selectedOrder.orderId}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Store: {selectedOrder.storeId} · Ngày: {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: "Order ID",       value: selectedOrder.orderId },
                  { label: "Store",          value: selectedOrder.storeId },
                  { label: "Payment Method", value: selectedOrder.paymentMethod },
                  { label: "Payment Option", value: selectedOrder.paymentOption },
                  { label: "Order Status",   value: selectedOrder.statusOrder },
                  { label: "Payment Status", value: selectedOrder.paymentStatus ?? "—" },
                  { label: "Priority Level", value: selectedOrder.priorityLevel ?? "—" },
                  { label: "Ngày đặt",       value: selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString() : "—" },
                ].map((f) => (
                  <div key={f.label} className="bg-muted/50 rounded-lg p-2">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</p>
                    <p className="text-xs font-medium text-foreground mt-0.5 truncate">{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Order Detail items */}
              {selectedOrder.orderDetail && selectedOrder.orderDetail.items?.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden mt-4">
                  <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      Chi tiết món ăn (Order Detail)
                      <span className="text-xs text-muted-foreground font-normal">#{selectedOrder.orderDetail.orderDetailId}</span>
                    </h4>
                  </div>

                  {/* Note */}
                  {selectedOrder.note && (
                    <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border-b border-amber-200 text-sm text-amber-800">
                      <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                      <span><span className="font-semibold">Note:</span> {selectedOrder.note}</span>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="admin-table-header">
                          <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Food Name</th>
                          <th className="px-4 py-2 text-center font-semibold text-muted-foreground uppercase tracking-wide">Central Food ID</th>
                          <th className="px-4 py-2 text-center font-semibold text-muted-foreground uppercase tracking-wide">Quantity</th>
                          <th className="px-4 py-2 text-right font-semibold text-muted-foreground uppercase tracking-wide">Unit Price (VND)</th>
                          <th className="px-4 py-2 text-right font-semibold text-muted-foreground uppercase tracking-wide">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedOrder.orderDetail.items.map((item, idx) => (
                          <tr key={idx} className="admin-table-row">
                            <td className="px-4 py-2.5 font-medium text-foreground">{item.foodName}</td>
                            <td className="px-4 py-2.5 text-center text-muted-foreground font-mono">{item.centralFoodId}</td>
                            <td className="px-4 py-2.5 text-center text-muted-foreground">{item.quantity}</td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">{item.unitPrice?.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-foreground">{item.totalAmount?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary/5 border-t border-primary/20">
                          <td colSpan={4} className="px-4 py-2.5 text-right text-xs font-bold text-foreground uppercase tracking-wide">Total Amount</td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-primary">
                            {selectedOrder.orderDetail.amount?.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SupplyDeliveryManagement;