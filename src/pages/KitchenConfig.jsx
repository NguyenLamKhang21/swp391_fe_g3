import { useState, useEffect } from "react";
import { getKitchenConfig, updateKitchenConfig } from "../api/authAPI";
import {
  CookingPot, Hash, Package, RefreshCw,
  AlertTriangle, Loader2, Info, Pencil, Check, X,
} from "lucide-react";
import { toast } from "react-toastify";

/* ── Per-key display metadata ── */
const CONFIG_META = {
  MAX_QUANTITY_PER_DAY: {
    icon: Package,
    color: "bg-violet-500",
    unit: "món",
    label: "Tổng số món tối đa / ngày",
    hint: "Giới hạn tổng số lượng món mà Central Kitchen có thể sản xuất trong một ngày.",
  },
  MAX_TYPES_PER_DAY: {
    icon: Hash,
    color: "bg-blue-500",
    unit: "loại",
    label: "Số loại món tối đa / ngày",
    hint: "Giới hạn số lượng loại món khác nhau mà Central Kitchen có thể xử lý mỗi ngày.",
  },
};

/* ── Config Card with inline edit ── */
const ConfigCard = ({ cfg, onUpdated }) => {
  const meta  = CONFIG_META[cfg.configKey] ?? {};
  const Icon  = meta.icon  ?? CookingPot;
  const color = meta.color ?? "bg-primary";
  const unit  = meta.unit  ?? "";
  const label = meta.label ?? cfg.configKey;
  const hint  = meta.hint  ?? cfg.description;

  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [editVal,  setEditVal]  = useState(String(cfg.configValue));
  const [editDesc, setEditDesc] = useState(cfg.description ?? "");

  const startEdit = () => {
    setEditVal(String(cfg.configValue));
    setEditDesc(cfg.description ?? "");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    const numVal = Number(editVal);
    if (!editVal || isNaN(numVal) || numVal <= 0) {
      toast.error("Giá trị phải là số nguyên dương.");
      return;
    }
    setSaving(true);
    try {
      await updateKitchenConfig(cfg.configKey, numVal, editDesc);
      toast.success(`Cập nhật "${label}" thành công!`);
      setEditing(false);
      onUpdated();           // refresh parent list
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-card rounded-2xl p-6 flex flex-col gap-5 border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-mono">
            {cfg.configKey}
          </p>
          <h3 className="text-sm font-bold text-foreground mt-0.5 leading-snug">
            {label}
          </h3>
        </div>
        {/* Edit toggle */}
        {!editing && (
          <button
            onClick={startEdit}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Chỉnh sửa
          </button>
        )}
      </div>

      {/* Value display or edit form */}
      {editing ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Giá trị mới {unit && <span className="text-muted-foreground font-normal">({unit})</span>}
            </label>
            <input
              type="number"
              min="1"
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              className="w-full text-sm rounded-lg border border-input px-3 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none transition-shadow"
              placeholder="VD: 40"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Mô tả</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              className="w-full text-sm rounded-lg border border-input px-3 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none transition-shadow resize-none"
              placeholder="Mô tả cấu hình..."
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Hủy
            </button>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
                : <><Check className="w-3.5 h-3.5" /> Lưu thay đổi</>}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Value pill */}
          <div className="bg-muted/40 rounded-xl px-6 py-5 flex items-end gap-2.5 border border-border/50">
            <span className="text-5xl font-extrabold text-foreground tabular-nums leading-none">
              {cfg.configValue}
            </span>
            {unit && (
              <span className="text-lg font-medium text-muted-foreground mb-1">
                {unit} / ngày
              </span>
            )}
          </div>

          {/* Description */}
          {hint && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground/60" />
              <span>{cfg.description || hint}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
export default function KitchenConfig() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await getKitchenConfig();
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setConfigs(data);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Không thể tải cấu hình. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  return (
    <div className="animate-fade-in space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Kitchen Config</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cấu hình giới hạn năng lực xử lý hàng ngày của Central Kitchen.
          </p>
        </div>
        <button
          onClick={fetchConfig}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* ── States ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Đang tải cấu hình...</p>
        </div>

      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-base font-semibold text-foreground">Lỗi tải dữ liệu</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchConfig}
            className="mt-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
          >
            Thử lại
          </button>
        </div>

      ) : configs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <CookingPot className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Không có cấu hình nào</p>
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu cấu hình từ server.</p>
        </div>

      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {configs.map((cfg) => (
            <ConfigCard key={cfg.configKey} cfg={cfg} onUpdated={fetchConfig} />
          ))}
        </div>
      )}
    </div>
  );
}