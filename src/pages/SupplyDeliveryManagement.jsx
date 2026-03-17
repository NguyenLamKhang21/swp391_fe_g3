import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getProvinceId, getDistrictAddress, getWardAddress, getAllOrders, createDelivery, getAllDelivery, trackOrder, getAllStore } from "../api/authAPI";
import { MapPin, Eye, X, Package, FileText, Truck, Map } from "lucide-react";

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

  const [storeNameMap, setStoreNameMap] = useState({});
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllStore();
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        const map = {};
        list.forEach((s) => { if (s.storeId) map[s.storeId] = s.storeName ?? s.storeId; });
        setStoreNameMap(map);
      } catch { /* silent */ }
    })();
  }, []);
  const getStoreName = (id) => storeNameMap[id] || id;

  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [deliveriesError, setDeliveriesError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);

  // Tracking States
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const handleTrackDelivery = async (delivery) => {
    setTrackingLoading(true);
    setTrackingError(null);
    setTrackingData(null);
    setIsTrackingModalOpen(true);
    try {
      const ghnCode = delivery.ghnOrderCode;
      const response = await trackOrder(ghnCode);
      const resData = response?.data;
      if (resData && resData.code === 200) {
        setTrackingData(resData.data);
      } else {
        setTrackingError("Không thể tải thông tin tracking hoặc api lỗi.");
      }
    } catch (err) {
      console.error("Error tracking order:", err);
      setTrackingError("Lỗi hệ thống khi theo dõi đơn hàng.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const closeTrackingModal = () => {
    setIsTrackingModalOpen(false);
    setTrackingData(null);
  };

  // Delivery Form States
  const [deliveryData, setDeliveryData] = useState({
    payment_type_id: 2,
    note: "Deliver during office hours",
    required_note: "CHOTHUHANG",
    to_name: "",
    to_phone: "",
    cod_amount: 0,
    service_type_id: 2,
  });
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [deliverySuccess, setDeliverySuccess] = useState(null);
  const [deliveryError, setDeliveryError] = useState(null);

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setDeliverySuccess(null);
    setDeliveryError(null);
    setDeliveryData({
      payment_type_id: 2,
      note: "Deliver during office hours",
      required_note: "CHOTHUHANG",
      to_name: "",
      to_phone: "",
      cod_amount: order?.orderDetail?.amount || 0,
      service_type_id: 2,
    });
  };

  const closeModal = () => setSelectedOrder(null);

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setSubmittingDelivery(true);
    setDeliveryError(null);
    setDeliverySuccess(null);
    try {
      const payload = {
        ...deliveryData,
        payment_type_id: Number(deliveryData.payment_type_id),
        cod_amount: Number(deliveryData.cod_amount),
        service_type_id: Number(deliveryData.service_type_id),
        storeId: selectedOrder?.storeId,
        orderDetailId: selectedOrder?.orderDetail?.orderDetailId || "",
      };
      await createDelivery(payload);
      setDeliverySuccess("Tạo đơn giao hàng thành công!");
    } catch (err) {
      console.error("Error creating delivery:", err);
      setDeliveryError("Không thể tạo đơn giao hàng. Vui lòng thử lại.");
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleDeliveryInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryData((prev) => ({ ...prev, [name]: value }));
  };

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

  useEffect(() => {
    const fetchDeliveries = async () => {
      setLoadingDeliveries(true);
      setDeliveriesError(null);
      try {
        const response = await getAllDelivery();
        const data = response?.data?.data || response?.data || [];
        setDeliveries(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching deliveries:", err);
        setDeliveriesError("Không thể tải danh sách giao hàng.");
      } finally {
        setLoadingDeliveries(false);
      }
    };

    fetchDeliveries();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="admin-card rounded-2xl p-6 bg-card border border-border shadow-sm">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6 border-b border-border pb-4">
          <MapPin className="w-6 h-6 text-primary" />
          Quản lý Giao hàng & Cung ứng
        </h2>

        <h3>Cung cấp thông tin giao hàng</h3>

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

      {/* Deliveries Table Section */}
      <div className="admin-card rounded-2xl bg-card border border-border shadow-sm overflow-hidden mt-6">
        <div className="px-6 py-5 border-b border-border flex items-center gap-2">
          <Truck className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Danh sách Giao hàng (Delivery)</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Thông tin các đơn đã gửi giao hàng.
            </p>
          </div>
        </div>

        {loadingDeliveries ? (
          <div className="p-8 text-center text-primary h-40 flex items-center justify-center">
            Đang tải dữ liệu giao hàng...
          </div>
        ) : deliveriesError ? (
          <div className="p-8 text-center text-destructive h-40 flex items-center justify-center">
            {deliveriesError}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="admin-table-header bg-muted/40 text-muted-foreground uppercase tracking-wider text-xs">
                  <th className="px-6 py-4 text-left font-semibold">Mã Vận Đơn</th>
                  <th className="px-6 py-4 text-left font-semibold">Mã Đơn GHN</th>
                  <th className="px-6 py-4 text-left font-semibold">Người Nhận</th>
                  <th className="px-6 py-4 text-left font-semibold">SĐT</th>
                  <th className="px-6 py-4 text-left font-semibold">Địa Chỉ</th>
                  <th className="px-6 py-4 text-right font-semibold">Tiền COD</th>
                  <th className="px-6 py-4 text-right font-semibold">Phí Ship</th>
                  <th className="px-6 py-4 text-left font-semibold">Ghi chú</th>
                  <th className="px-6 py-4 text-center font-semibold text-primary">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-muted-foreground">
                      Không có đơn giao hàng nào
                    </td>
                  </tr>
                ) : (
                  deliveries.map((delivery, index) => (
                    <tr key={delivery.shipmentCodeId || index} className="admin-table-row hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-primary">
                        {delivery.shipmentCodeId || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono">
                        {delivery.ghnOrderCode || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-foreground font-medium whitespace-nowrap">
                        {delivery.toName || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {delivery.toPhone || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground min-w-[200px]">
                        {delivery.toAddress || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                        {delivery.codAmount?.toLocaleString() || "0"} đ
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-amber-600">
                        {delivery.shipInvoice?.totalPrice?.toLocaleString() || "0"} đ
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-[200px] truncate" title={delivery.note}>
                        {delivery.note || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {delivery.ghnOrderCode && (
                          <button
                            onClick={() => handleTrackDelivery(delivery)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            <Map className="w-3.5 h-3.5" />
                            Theo dõi
                          </button>
                        )}
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
                  Store: {getStoreName(selectedOrder.storeId)} · Ngày: {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString() : "N/A"}
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
                  { label: "Store",          value: getStoreName(selectedOrder.storeId) },
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

              {/* TẠO ĐƠN GIAO HÀNG (DELIVERY FORM) — ẩn khi đơn bị hủy/từ chối */}
              {selectedOrder && selectedOrder.statusOrder !== "CANCELLED" && selectedOrder.statusOrder !== "REJECTED" && (
                <div className="border border-border rounded-xl mt-6 p-4 md:p-5 bg-muted/30 shadow-sm">
                  <h4 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Tạo Đơn Giao Hàng
                  </h4>
                  {deliverySuccess && (
                    <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200">
                      {deliverySuccess}
                    </div>
                  )}
                  {deliveryError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                      {deliveryError}
                    </div>
                  )}
                  <form onSubmit={handleDeliverySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cột 1 */}
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="text-xs font-semibold text-foreground">Tên người nhận (to_name)</label>
                        <input type="text" name="to_name" required value={deliveryData.to_name} onChange={handleDeliveryInputChange} className="w-full text-sm rounded-lg border border-input px-3 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none transition-shadow" placeholder="VD: Hoàng văn" />
                      </div>
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="text-xs font-semibold text-foreground">Số điện thoại (to_phone)</label>
                        <input type="text" name="to_phone" required value={deliveryData.to_phone} onChange={handleDeliveryInputChange} className="w-full text-sm rounded-lg border border-input px-3 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none transition-shadow" placeholder="VD: 0977503776" />
                      </div>

                      {/* Cột 2 */}
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="text-xs font-semibold text-foreground">Tiền thu hộ / COD (cod_amount)</label>
                        <input type="number" name="cod_amount" required value={deliveryData.cod_amount} onChange={handleDeliveryInputChange} className="w-full text-sm rounded-lg border border-input px-3 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none transition-shadow" />
                      </div>
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="text-xs font-semibold text-foreground">Người trả phí (payment_type_id)</label>
                        <select name="payment_type_id" value={deliveryData.payment_type_id} onChange={handleDeliveryInputChange} className="w-full text-sm rounded-lg border border-input px-3 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none transition-shadow">
                          <option value={1}>1 - Người bán trả</option>
                          <option value={2}>2 - Người mua trả</option>
                        </select>
                      </div>

                      {/* Cột 3 */}
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="text-xs font-semibold text-foreground">Dịch vụ (service_type_id)</label>
                        <select name="service_type_id" value={deliveryData.service_type_id} onChange={handleDeliveryInputChange} className="w-full text-sm rounded-lg border border-input px-3 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none transition-shadow">
                          <option value={1}>1 - Nhanh</option>
                          <option value={2}>2 - Chuẩn</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="text-xs font-semibold text-foreground">Ghi chú bắt buộc (required_note)</label>
                        <select name="required_note" value={deliveryData.required_note} onChange={handleDeliveryInputChange} className="w-full text-sm rounded-lg border border-input px-3 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none transition-shadow">
                          <option value="CHOTHUHANG">Cho thử hàng</option>
                          <option value="CHOXEMHANGKHONGTHU">Cho xem hàng, không thử</option>
                          <option value="KHONGCHOXEMHANG">Không cho xem hàng</option>
                        </select>
                      </div>

                      {/* Full width ghi chú */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-foreground">Ghi chú thêm (note)</label>
                        <textarea name="note" value={deliveryData.note} onChange={handleDeliveryInputChange} rows={2} className="w-full text-sm rounded-lg border border-input px-3 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none transition-shadow resize-none" placeholder="VD: Deliver during office hours"></textarea>
                      </div>
                    </div>
                    <div className="flex justify-end pt-3">
                      <button type="submit" disabled={submittingDelivery} className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                        {submittingDelivery ? "Đang xử lý..." : "Xác nhận Tạo Đơn Giao Hàng"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* TRACKING MODAL */}
      {isTrackingModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeTrackingModal} />

          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in">
            {/* Modal header */}
            <div className="flex-shrink-0 px-5 py-3 border-b border-border flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Map className="w-5 h-5 text-emerald-600" />
                  Theo Dõi Giao Hàng
                </h3>
              </div>
              <button
                onClick={closeTrackingModal}
                className="p-2 rounded-lg bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {trackingLoading ? (
                <div className="h-40 flex items-center justify-center text-primary font-medium">
                  Đang tải thông tin theo dõi...
                </div>
              ) : trackingError ? (
                <div className="h-40 flex items-center justify-center text-destructive font-medium">
                  {trackingError}
                </div>
              ) : trackingData ? (
                <div className="space-y-6">
                  {/* Status & Info Header */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Trạng thái hiện tại</p>
                      <p className="text-lg font-bold text-emerald-800 capitalize">
                        {trackingData.status || "N/A"}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">GHN Order Code</p>
                      <p className="text-lg font-bold text-foreground font-mono">
                        {trackingData.order_code || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Locations Detail */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" /> Điểm Gửi Hàng
                      </h4>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Người gửi:</span> {trackingData.from_name}</p>
                        <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">SĐT:</span> {trackingData.from_phone}</p>
                        <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Địa chỉ:</span> {trackingData.from_address}</p>
                      </div>
                    </div>
                    <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" /> Điểm Nhận Hàng
                      </h4>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Người nhận:</span> {trackingData.to_name}</p>
                        <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">SĐT:</span> {trackingData.to_phone}</p>
                        <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Địa chỉ:</span> {trackingData.to_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Parcel Details */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <h4 className="text-sm font-bold text-foreground">Chi Tiết Kiện Hàng</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Khối lượng</p>
                        <p className="text-sm font-medium">{trackingData.weight} g</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Kích thước</p>
                        <p className="text-sm font-medium">{trackingData.length}x{trackingData.width}x{trackingData.height} cm</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tiền thu hộ (COD)</p>
                        <p className="text-sm font-bold text-emerald-600">{trackingData.cod_amount?.toLocaleString() || "0"} đ</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dịch vụ</p>
                        <p className="text-sm font-medium">{trackingData.service_type_id === 2 ? 'Chuẩn' : 'Nhanh'}</p>
                      </div>
                    </div>
                    {trackingData.content && (
                      <div className="mt-3 text-xs bg-muted/50 p-3 rounded-lg border border-border">
                        <span className="font-semibold">Nội dung:</span> {trackingData.content}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SupplyDeliveryManagement;