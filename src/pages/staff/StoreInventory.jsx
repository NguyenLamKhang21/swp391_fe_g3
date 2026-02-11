import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "@/contexts/OrderContext";
import { currentUser, ingredients, formatCurrency } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Package,
  Search,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const StoreInventory = () => {
  const { inventory } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const storeInv = inventory[currentUser.storeId];

  const categories = useMemo(() => {
    const cats = [...new Set(ingredients.map((i) => i.category))];
    return ["all", ...cats];
  }, []);

  const inventoryItems = useMemo(() => {
    if (!storeInv) return [];

    return storeInv.items
      .map((item) => {
        const ingredient = ingredients.find((i) => i.id === item.ingredientId);
        return {
          ...item,
          name: ingredient?.name || "",
          unit: ingredient?.unit || "",
          category: ingredient?.category || "",
          pricePerUnit: ingredient?.pricePerUnit || 0,
          isLow: item.quantity <= item.minLevel,
          isEmpty: item.quantity === 0,
          stockPercent: item.minLevel > 0
            ? Math.min((item.quantity / item.minLevel) * 100, 100)
            : 100,
        };
      })
      .filter((item) => {
        const matchSearch = item.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchCategory =
          categoryFilter === "all" || item.category === categoryFilter;
        const matchStock =
          stockFilter === "all" ||
          (stockFilter === "low" && item.isLow && !item.isEmpty) ||
          (stockFilter === "empty" && item.isEmpty) ||
          (stockFilter === "ok" && !item.isLow);
        return matchSearch && matchCategory && matchStock;
      });
  }, [storeInv, searchTerm, categoryFilter, stockFilter]);

  const summary = useMemo(() => {
    if (!storeInv) return { total: 0, low: 0, empty: 0, ok: 0 };
    const items = storeInv.items.map((item) => ({
      isLow: item.quantity <= item.minLevel,
      isEmpty: item.quantity === 0,
    }));
    return {
      total: items.length,
      low: items.filter((i) => i.isLow && !i.isEmpty).length,
      empty: items.filter((i) => i.isEmpty).length,
      ok: items.filter((i) => !i.isLow).length,
    };
  }, [storeInv]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tồn kho cửa hàng</h1>
          <p className="text-muted-foreground mt-1">{currentUser.storeName}</p>
        </div>
        <Link to="/staff/orders/create">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Đặt hàng bổ sung
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary.total}</p>
              <p className="text-xs text-muted-foreground">Tổng nguyên liệu</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary.ok}</p>
              <p className="text-xs text-muted-foreground">Đủ hàng</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary.low}</p>
              <p className="text-xs text-muted-foreground">Sắp hết</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary.empty}</p>
              <p className="text-xs text-muted-foreground">Hết hàng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm nguyên liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="sm:w-48"
        >
          <option value="all">Tất cả danh mục</option>
          {categories.slice(1).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </Select>
        <Select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="sm:w-40"
        >
          <option value="all">Tất cả</option>
          <option value="ok">Đủ hàng</option>
          <option value="low">Sắp hết</option>
          <option value="empty">Hết hàng</option>
        </Select>
      </div>

      {/* Inventory Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Nguyên liệu
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Danh mục
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Tồn kho
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Mức tối thiểu
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Trạng thái
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-32">
                  Mức kho
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventoryItems.map((item) => (
                <tr
                  key={item.ingredientId}
                  className="hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.pricePerUnit)} / {item.unit}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                    {item.minLevel} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.isEmpty ? (
                      <Badge className="bg-red-100 text-red-700 border-0">
                        Hết hàng
                      </Badge>
                    ) : item.isLow ? (
                      <Badge className="bg-yellow-100 text-yellow-700 border-0">
                        Sắp hết
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border-0">
                        Đủ hàng
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.isEmpty
                            ? "bg-red-500"
                            : item.isLow
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${item.stockPercent}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {inventoryItems.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Không tìm thấy nguyên liệu nào
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreInventory;
