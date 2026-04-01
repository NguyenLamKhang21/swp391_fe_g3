import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Store, RefreshCw, Search, AlertTriangle,
  Loader2, MapPin, Phone, Mail, Shield,
  Building2, DollarSign, CreditCard, CheckCircle, XCircle, Plus,
  X, User, Hash, Info,
} from "lucide-react";
import { toast } from "react-toastify";
/**
 * ===== CÁC API ĐƯỢC SỬ DỤNG TRONG TRANG NÀY =====
 *
 * 1. getAllStore          → GET  /franchise-stores
 *    - Mục đích: Lấy danh sách TẤT CẢ cửa hàng nhượng quyền từ backend.
 *    - Dùng ở: hàm fetchStores() (dòng ~94) — hiển thị bảng "All Stores".
 *
 * 2. createNewFranchiseStore(data) → POST /franchise-stores
 *    - Mục đích: Tạo một cửa hàng nhượng quyền MỚI.
 *    - Dữ liệu gửi lên (payload): { storeName, address, province, district, ward }
 *    - Dùng ở: hàm handleCreateStore() (dòng ~299) — khi nhấn nút "Create Store".
 *
 * 3. getAllUsers           → GET  /auth
 *    - Mục đích: Lấy danh sách tất cả người dùng, sau đó nhóm theo storeId
 *      để hiển thị nhân viên thuộc từng cửa hàng.
 *
 * 4. getProvinceId         → GET  /address/provinces
 *    - Mục đích: Lấy danh sách Tỉnh/Thành phố từ API GHN (Giao Hàng Nhanh).
 *    - Dùng ở: useEffect khi mount (dòng ~209) và trong fetchStores().
 *
 * 5. getDistrictAddress(provinceId) → GET /address/districts?provinceId=...
 *    - Mục đích: Lấy danh sách Quận/Huyện theo Tỉnh đã chọn.
 *    - Dùng ở: handleProvinceChange() (dòng ~227) và fetchStores().
 *
 * 6. getWardAddress(districtId)     → GET /address/wards?districtId=...
 *    - Mục đích: Lấy danh sách Phường/Xã theo Quận đã chọn.
 *    - Dùng ở: handleDistrictChange() (dòng ~257) và fetchStores().
 */
import { getAllStore, getAllUsers, createNewFranchiseStore, getProvinceId, getDistrictAddress, getWardAddress } from "../api/authAPI";

/* ─── Debt Status Badge ─── */
const DebtBadge = ({ deptStatus }) =>
  deptStatus ? (
    <span className="sm-badge sm-badge-debt">
      <XCircle className="w-3.5 h-3.5" />
      In Debt
    </span>
  ) : (
    <span className="sm-badge sm-badge-clear">
      <CheckCircle className="w-3.5 h-3.5" />
      No Debt
    </span>
  );

/* ─── Payment method pill ─── */
const PaymentPill = ({ method }) => (
  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
    <CreditCard className="w-3 h-3" />
    {method}
  </span>
);

/* ─── Revenue formatter ─── */
const fmtRevenue = (n) => {
  if (n == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
};

//form cho tạo store mới
const EMPTY_STORE_FORM = {
  storeName:    "",
  address:      "",
  province:     "",   // name stored for payload
  provinceId:   "",   // id used to fetch districts
  district:     "",
  districtId:   "",
  ward:         "",
  wardCode:     "",
}

/* ─── Store avatar ─── */
const StoreAvatar = ({ name }) => (
  <div className="w-9 h-9 rounded-xl admin-sidebar-brand flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
    {(name ?? "?").charAt(0).toUpperCase()}
  </div>
);

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="admin-card rounded-xl p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════ */
const StoreManagement = () => {
  const [stores,     setStores]     = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [search,     setSearch]     = useState("");
  const [debtFilter, setDebtFilter] = useState("ALL"); // ALL | DEBT | CLEAR
  const [storeForm, setStoreForm] = useState(EMPTY_STORE_FORM);
  const [creating, setCreating] = useState(false);

  /* ── Users + storeId map ── */
  const [usersByStore, setUsersByStore] = useState({}); // storeId → User[]

  // ── Address cascade state ──
  const [provinces,       setProvinces]       = useState([]);
  const [districts,       setDistricts]       = useState([]);
  const [wards,           setWards]           = useState([]);
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingWard,     setLoadingWard]     = useState(false);

  /* ── Lấy danh sách tất cả cửa hàng (HIỂN THỊ BẢNG "ALL STORES") ── */
  // API chính: getAllStore() → GET /franchise-stores
  // Hàm này được gọi khi component mount lần đầu (useEffect dòng ~347)
  // và mỗi khi người dùng nhấn nút "Refresh" hoặc sau khi tạo store mới thành công.
  const fetchStores = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Bước phụ: Lấy danh sách tỉnh/thành phố từ GHN (nếu chưa có trong state)
      // API: getProvinceId() → GET /address/provinces
      // Mục đích: Dùng để map tên tỉnh → ID tỉnh, phục vụ việc tra cứu tên Quận/Phường
      let allProvs = provinces;
      if (allProvs.length === 0) {
        try {
          const pRes = await getProvinceId();
          allProvs = Array.isArray(pRes.data) ? pRes.data : pRes.data?.data || [];
          setProvinces(allProvs);
        } catch (e) {}
      }

      // ★ API CHÍNH ĐỂ HIỂN THỊ TẤT CẢ CỬA HÀNG ★
      // getAllStore() → gọi GET /franchise-stores
      // Trả về mảng các object store: { storeId, storeName, address, province, district, ward, ... }
      const res = await getAllStore();
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      // Sử dụng ID để gọi API và lấy tên thật của quận, phường 
      const provNameToId = {};
      allProvs.forEach(p => { provNameToId[p.ProvinceName] = p.ProvinceID; });

      const distCache = {};
      const wardCache = {};

      // BƯỚC 1: Thu thập tất cả các Province ID và District ID độc nhất 
      // Việc này giúp tránh gọi trùng lặp cùng một ID nhiều lần.
      const requiredPIds = new Set();
      const requiredDIds = new Set();

      for (const s of list) {
        if (s.province && s.district) {
          const pId = provNameToId[s.province];
          if (pId) requiredPIds.add(pId);
          if (s.ward) requiredDIds.add(s.district);
        }
      }

      // BƯỚC 2: Gọi API đồng thời (Parallel Fetching)
      // Dùng Promise.all để gửi tất cả các requests lên GHN cùng một lúc
      // Thay vì phải chờ từng request báo về xong mới chạy tiếp (N+1 Query Problem).
      await Promise.all(
        Array.from(requiredPIds).map(async (pId) => {
          try {
            const dRes = await getDistrictAddress(pId);
            distCache[pId] = Array.isArray(dRes.data) ? dRes.data : dRes.data?.data || [];
          } catch (e) { distCache[pId] = []; }
        })
      );

      // Tuơng tự, fetch tất cả danh sách Phường/Xã cho các Quận/Huyện song song.
      await Promise.all(
        Array.from(requiredDIds).map(async (dId) => {
          try {
            const wRes = await getWardAddress(dId);
            wardCache[dId] = Array.isArray(wRes.data) ? wRes.data : wRes.data?.data || [];
          } catch (e) { wardCache[dId] = []; }
        })
      );

      // BƯỚC 3: Xử lý dữ liệu đồng bộ
      // Gắn tên thật của Quận và Phường vào từng Store ngay lập tức trên máy khách.
      for (const s of list) {
        s.districtName = s.district ? String(s.district) : "";
        s.wardName = s.ward ? String(s.ward) : "";

        if (s.province && s.district) {
          const pId = provNameToId[s.province];
          if (pId && distCache[pId]) {
            const dMatch = distCache[pId].find(d => String(d.DistrictID) === String(s.district));
            if (dMatch) s.districtName = dMatch.DistrictName;
          }
          if (s.ward && wardCache[s.district]) {
            const wMatch = wardCache[s.district].find(w => String(w.WardCode) === String(s.ward));
            if (wMatch) s.wardName = wMatch.WardName;
          }
        }
      }

      setStores(list);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to load stores.";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch users → build storeId map ── */
  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      // Group users by the storeId stored in franchiseStoreInfo
      const map = {};
      list.forEach((u) => {
        const sid = u.franchiseStoreInfo?.storeId;
        if (sid) {
          if (!map[sid]) map[sid] = [];
          map[sid].push(u);
        }
      });
      setUsersByStore(map);
    } catch { /* silent */ }
  };

  /* ── Fetch provinces on mount ── */
  useEffect(() => {
    const load = async () => {
      setLoadingProvince(true);
      try {
        const res = await getProvinceId();
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        setProvinces(list);
      } catch { /* silent – user can still type */ }
      finally { setLoadingProvince(false); }
    };
    load();
  }, []);

  /* ── When province changes → fetch districts ── */
  const handleProvinceChange = async (e) => {
    const selectedId   = e.target.value;
    const selectedName = e.target.options[e.target.selectedIndex]?.text ?? "";
    // reset district + ward
    setDistricts([]);
    setWards([]);
    setStoreForm((prev) => ({
      ...prev,
      provinceId: selectedId,
      province:   selectedId ? selectedName : "",
      districtId: "",
      district:   "",
      wardCode:   "",
      ward:       "",
    }));
    if (!selectedId) return;
    setLoadingDistrict(true);
    try {
      const res = await getDistrictAddress(selectedId);
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setDistricts(list);
    } catch { toast.error("Could not load districts"); }
    finally { setLoadingDistrict(false); }
  };

  /* ── When district changes → fetch wards ── */
  const handleDistrictChange = async (e) => {
    const selectedId   = e.target.value;
    const selectedName = e.target.options[e.target.selectedIndex]?.text ?? "";
    setWards([]);
    setStoreForm((prev) => ({
      ...prev,
      districtId: selectedId,
      district:   selectedId ? selectedName : "",
      wardCode:   "",
      ward:       "",
    }));
    if (!selectedId) return;
    setLoadingWard(true);
    try {
      const res = await getWardAddress(selectedId);
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setWards(list);
    } catch { toast.error("Could not load wards"); }
    finally { setLoadingWard(false); }
  };

  /* ── Ward change ── */
  const handleWardChange = (e) => {
    const selectedCode = e.target.value;
    const selectedName = e.target.options[e.target.selectedIndex]?.text ?? "";
    setStoreForm((prev) => ({
      ...prev,
      wardCode: selectedCode,
      ward:     selectedCode ? selectedName : "",
    }));
  };

  /* ── Form handlers ── */
  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    setStoreForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ── XỬ LÝ TẠO CỬA HÀNG MỚI (CREATE NEW STORE) ── */
  // ★ API CHÍNH: createNewFranchiseStore(payload) → POST /franchise-stores
  // Gửi thông tin cửa hàng mới lên backend để tạo record trong database.
  const handleCreateStore = async (e) => {
    e.preventDefault(); // Ngăn trình duyệt refresh trang khi submit form

    // Kiểm tra dữ liệu đầu vào (validation phía client)
    if (!storeForm.storeName.trim()) {
      toast.error("Store name is required");
      return;
    }
    if (storeForm.storeName.trim().length > 100) {
      toast.error("Store name must be 100 characters or less");
      return;
    }
    if (!storeForm.address.trim()) {
      toast.error("Address is required");
      return;
    }
    if (storeForm.address.trim().length > 255) {
      toast.error("Address must be 255 characters or less");
      return;
    }

    try {
      setCreating(true);

      // Chuẩn bị dữ liệu gửi lên backend (payload):
      //   province → String  (Tên tỉnh/thành phố lấy từ GHN)
      //   district → Integer (Mã số quận/huyện từ GHN - DistrictID)
      //   ward     → String  (Mã phường/xã từ GHN - WardCode)
      const payload = {
        storeName: storeForm.storeName,
        address:   storeForm.address,
        province:  storeForm.province  || null,              // ← Tên tỉnh (String)
        district:  storeForm.districtId ? Number(storeForm.districtId) : null, // ← Mã quận (Integer)
        ward:      storeForm.wardCode   || null,             // ← Mã phường (String)
      };

      // ★ GỌI API TẠO STORE: POST /franchise-stores với body = payload ở trên
      const res = await createNewFranchiseStore(payload);

      // Axios only resolves for 2xx, so reaching here already means success.
      // We double-check with res.status just in case, but res.data shape can vary.
      if (res.status >= 200 && res.status < 300) {
        toast.success("Store created successfully!");
        setStoreForm(EMPTY_STORE_FORM); // Reset form về trạng thái rỗng
        setDistricts([]);
        setWards([]);
        fetchStores(); // Gọi lại getAllStore() để cập nhật bảng danh sách cửa hàng
      } else {
        toast.error(res.data?.message ?? "Failed to create store");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Server error - please try again");
    } finally {
      setCreating(false);
    }
  };

  // Khi component được render lần đầu (mount):
  // 1. fetchStores() → gọi getAllStore() (GET /franchise-stores) để lấy danh sách cửa hàng
  // 2. fetchUsers()  → gọi getAllUsers() (GET /auth) để lấy danh sách nhân viên
  useEffect(() => { fetchStores(); fetchUsers(); }, []);

  /* ── Derived stats ── */
  const total        = stores.length;
  const withDebt     = stores.filter((s) => s.deptStatus === true).length;
  const withoutDebt  = stores.filter((s) => s.deptStatus === false).length;
  const totalRevenue = stores.reduce((sum, s) => sum + (s.revenue ?? 0), 0);

  /* ── Filtered list ── */
  const filtered = stores.filter((s) => {
    const q = search.toLowerCase();
    const matchText =
      s.storeName?.toLowerCase().includes(q) ||
      s.storeId?.toLowerCase().includes(q)   ||
      s.address?.toLowerCase().includes(q)   ||
      s.province?.toLowerCase().includes(q)  ||
      s.districtName?.toLowerCase().includes(q) ||
      String(s.district || "")?.includes(q)  ||
      s.wardName?.toLowerCase().includes(q)  ||
      String(s.ward || "")?.includes(q)      ||
      s.managerEmail?.toLowerCase().includes(q) ||
      s.numberOfContact?.includes(q);

    const matchDebt =
      debtFilter === "ALL" ||
      (debtFilter === "DEBT"  && s.deptStatus === true)  ||
      (debtFilter === "CLEAR" && s.deptStatus === false);

    return matchText && matchDebt;
  });

  /* ══ render ══ */
  return (
    <div className="animate-fade-in space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Store Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all franchise stores in the system.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Admin Only</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4">
        <StatCard icon={Building2}    label="Total Stores"  value={total}       color="admin-sidebar-brand" />
      </div>

        {/* ── Create Store Card ── */}
      <div className="admin-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl admin-sidebar-brand flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Create New Store</h3>
          </div>
        </div>

        <form onSubmit={handleCreateStore} className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Store Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sm-storeName">
              Store Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="sm-storeName" name="storeName" value={storeForm.storeName}
                onChange={handleStoreChange} placeholder="e.g. Branch District 1"
                maxLength={100} required className="um-input pl-10" />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sm-address">
              Address <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="sm-address" name="address" value={storeForm.address}
                onChange={handleStoreChange} placeholder="e.g. 123 Nguyen Hue St."
                maxLength={255} required className="um-input pl-10" />
            </div>
          </div>

          {/* Province */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sm-province">
              Province / City
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <select
                id="sm-province"
                value={storeForm.provinceId}
                onChange={handleProvinceChange}
                disabled={loadingProvince}
                className="um-input pl-10 appearance-none"
              >
                <option value="">
                  {loadingProvince ? "Loading…" : "-- Select province / city --"}
                </option>
                {provinces.map((p) => (
                  <option key={p.ProvinceID} value={p.ProvinceID}>
                    {p.ProvinceName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* District */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sm-district">
              District
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <select
                id="sm-district"
                value={storeForm.districtId}
                onChange={handleDistrictChange}
                disabled={!storeForm.provinceId || loadingDistrict}
                className="um-input pl-10 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingDistrict
                    ? "Loading…"
                    : !storeForm.provinceId
                    ? "-- Select province first --"
                    : "-- Select district --"}
                </option>
                {districts.map((d) => (
                  <option key={d.DistrictID} value={d.DistrictID}>
                    {d.DistrictName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ward */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sm-ward">
              Ward
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <select
                id="sm-ward"
                value={storeForm.wardCode}
                onChange={handleWardChange}
                disabled={!storeForm.districtId || loadingWard}
                className="um-input pl-10 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingWard
                    ? "Loading…"
                    : !storeForm.districtId
                    ? "-- Select district first --"
                    : "-- Select ward --"}
                </option>
                {wards.map((w) => (
                  <option key={w.WardCode} value={w.WardCode}>
                    {w.WardName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-end pt-2">
            <button type="submit" disabled={creating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm
                hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {creating
                ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</>
                : <><Plus className="w-4 h-4" />Create Store</>}
            </button>
          </div>
        </form>
      </div>


      {/* ── Table Card ── */}
      <div className="admin-card rounded-xl overflow-hidden">

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">All Stores</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? "Loading…" : `${filtered.length} store${filtered.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Debt filter */}
            <select
              id="sm-debt-filter"
              value={debtFilter}
              onChange={(e) => setDebtFilter(e.target.value)}
              className="um-input py-2 text-sm"
            >
              <option value="ALL">All</option>
              <option value="DEBT">In Debt</option>
              <option value="CLEAR">No Debt</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="sm-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stores…"
                className="um-input pl-9 py-2 text-sm w-52"
              />
            </div>

            {/* Refresh */}
            <button
              id="sm-refresh-btn"
              onClick={fetchStores}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Loading stores…</p>
          </div>
        )}

        {/* Error */}
        {!loading && fetchError && (
          <div className="flex flex-col items-center gap-3 py-14 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-base font-semibold text-foreground">Failed to load stores</p>
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <button
              onClick={fetchStores}
              className="mt-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Store List */}
        {!loading && !fetchError && (
          <div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Store className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold text-foreground">No stores found</p>
                <p className="text-sm text-muted-foreground">
                  {search || debtFilter !== "ALL"
                    ? "Try adjusting your filters or search terms."
                    : "No stores in the system yet."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 p-6 overflow-x-hidden">
                {filtered.map((s, idx) => {
                  const users = usersByStore[s.storeId] ?? [];
                  return (
                    <div
                      key={s.storeId ?? idx}
                      className="rounded-2xl border border-border bg-muted/10 p-6 flex flex-col xl:flex-row gap-8 animate-fade-in"
                      style={{ animationDelay: `${(idx % 10) * 40}ms` }}
                    >
                      {/* Left: Store Info */}
                      <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-4">
                          <StoreAvatar name={s.storeName} />
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold text-foreground truncate">{s.storeName ?? "—"}</h3>
                            <p className="text-sm text-muted-foreground font-mono truncate">{s.storeId ?? "—"}</p>
                          </div>
                          <div className="ml-auto shrink-0">
                            <DebtBadge deptStatus={s.deptStatus} />
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Store className="w-4 h-4" /> Store Information
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "Province / City",  value: s.province, wide: true },
                              { label: "Address",    value: s.address, wide: true },
                              { label: "District",       value: s.districtName },
                              { label: "Ward",value: s.wardName },
                              { label: "Contact",    value: s.numberOfContact, wide: true },
                            ].map(({ label, value, wide }) => (
                              <div key={label} className={`bg-background shadow-sm rounded-xl border border-border/50 p-3 ${wide ? "col-span-2" : ""}`}>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                                <p className="text-sm font-medium text-foreground mt-1 break-words">{value || "—"}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Users inside Store */}
                      <div className="flex-1 w-full xl:max-w-md">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <User className="w-4 h-4" /> Store Staff
                        </p>
                        
                        {users.length === 0 ? (
                          <div className="flex flex-col items-center gap-3 py-8 text-center border-2 border-dashed border-border rounded-xl bg-background/50">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">No staff</p>
                              <p className="text-xs text-muted-foreground mt-0.5">No staff have been assigned to this store yet.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {users.map((u) => (
                              <div key={u.id} className="rounded-xl border border-border bg-background p-4 shadow-sm hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-full admin-sidebar-brand flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                                    {(u.fullName ?? "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-foreground truncate text-sm">{u.fullName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                  </div>
                                  <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${
                                    u.active
                                      ? "text-emerald-700 bg-emerald-100 border-emerald-200"
                                      : "text-red-700 bg-red-100 border-red-200"
                                  }`}>
                                    {u.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {u.active ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { label: "Role", value: u.role },
                                    { label: "Phone", value: u.phone },
                                  ].map(({ label, value, wide }) => (
                                    <div key={label} className={`bg-muted/30 rounded-lg p-2.5 ${wide ? "col-span-2" : ""}`}>
                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                                      <p className="text-xs font-medium text-foreground mt-0.5 truncate font-mono">{value || "—"}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && !fetchError && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {stores.length} stores
            </p>
          </div>
        )}
      </div>

      {/* ── Badge styles ── */}
      <style>{`
        .sm-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          white-space: nowrap;
        }
        .sm-badge-debt  { color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; }
        .sm-badge-clear { color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; }
      `}</style>

    </div>
  );
};

export default StoreManagement;
