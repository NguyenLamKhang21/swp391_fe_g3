import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChefHat,
  Store,
  Truck,
  Users,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Shield,
  Zap,
  Clock,
  Package,
  ClipboardList,
  Star,
  ChevronRight,
} from "lucide-react";

const Homepage = () => {
  const { isAuthenticated, getDashboardPath } = useAuth();

  const features = [
    {
      icon: Store,
      title: "Quản lý Cửa hàng Franchise",
      description:
        "Tạo đơn hàng, kiểm tra tồn kho, theo dõi trạng thái giao hàng real-time từ bất kỳ chi nhánh nào.",
      color: "from-orange-500 to-amber-500",
      lightColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      icon: Truck,
      title: "Điều phối Cung ứng",
      description:
        "Xét duyệt đơn hàng, kiểm tra tồn kho Central Kitchen, tối ưu lịch trình phân phối.",
      color: "from-blue-500 to-cyan-500",
      lightColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: ChefHat,
      title: "Bếp Trung Tâm",
      description:
        "Nhận yêu cầu sản xuất, quản lý quy trình chế biến, cập nhật trạng thái đơn hàng.",
      color: "from-purple-500 to-pink-500",
      lightColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      icon: BarChart3,
      title: "Báo cáo & Phân tích",
      description:
        "Dashboard tổng quan, báo cáo doanh thu, phân tích hiệu quả vận hành toàn chuỗi.",
      color: "from-emerald-500 to-green-500",
      lightColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  const stats = [
    { value: "50+", label: "Chi nhánh" },
    { value: "10K+", label: "Đơn hàng/tháng" },
    { value: "99.5%", label: "Tỉ lệ giao đúng hẹn" },
    { value: "24/7", label: "Hỗ trợ kỹ thuật" },
  ];

  const workflows = [
    {
      step: "01",
      icon: ClipboardList,
      title: "Tạo đơn hàng",
      description: "Cửa hàng kiểm tra tồn kho và tạo đơn yêu cầu nguyên liệu từ Bếp Trung Tâm.",
    },
    {
      step: "02",
      icon: Shield,
      title: "Xét duyệt",
      description: "Supply Coordinator xem xét đơn hàng, kiểm tra tồn kho và phê duyệt.",
    },
    {
      step: "03",
      icon: ChefHat,
      title: "Sản xuất & Đóng gói",
      description: "Central Kitchen chuẩn bị nguyên liệu, sản xuất nếu cần và đóng gói.",
    },
    {
      step: "04",
      icon: Package,
      title: "Giao hàng",
      description: "Nguyên liệu được vận chuyển đến cửa hàng đúng thời gian yêu cầu.",
    },
  ];

  const testimonials = [
    {
      name: "Nguyễn Minh Tuấn",
      role: "Quản lý Chi nhánh Quận 1",
      content: "Hệ thống giúp chúng tôi giảm 40% thời gian đặt hàng và không bao giờ bị thiếu nguyên liệu nữa.",
      rating: 5,
    },
    {
      name: "Trần Thị Hương",
      role: "Supply Coordinator",
      content: "Quy trình duyệt đơn rõ ràng, kiểm tra tồn kho tự động giúp tôi xử lý nhanh gấp 3 lần.",
      rating: 5,
    },
    {
      name: "Lê Hoàng Nam",
      role: "Trưởng Bếp Trung Tâm",
      content: "Nhận đơn sản xuất rõ ràng, cập nhật trạng thái dễ dàng. Giảm sai sót đáng kể.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ========== NAVBAR ========== */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                CentralKitchen
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Tính năng
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Quy trình
              </a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Đánh giá
              </a>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link to={getDashboardPath()}>
                  <Button className="gap-2">
                    Vào Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="hidden sm:inline-flex">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button className="gap-2">
                      Bắt đầu ngay
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Hệ thống quản lý chuỗi cung ứng #1
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Quản lý{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">
                Bếp Trung Tâm
              </span>
              <br />
              & Chuỗi Cửa hàng Franchise
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Giải pháp toàn diện giúp đồng bộ vận hành, kiểm soát chất lượng
              và tối ưu hiệu quả từ Bếp Trung Tâm đến từng cửa hàng.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link to="/login">
                <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg shadow-primary/25">
                  Đăng nhập hệ thống
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="gap-2 text-base px-8 h-12">
                  Xem quy trình
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </a>
            </div>

            {/* Demo accounts hint */}
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/80 border border-border">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Dùng thử ngay với tài khoản demo &mdash;{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  xem tại trang đăng nhập
                </Link>
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <p className="text-3xl lg:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Tính năng
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Mọi thứ bạn cần để vận hành chuỗi
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Mỗi vai trò trong hệ thống có giao diện và công cụ riêng, phù hợp với công việc hàng ngày.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-card border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 rounded-xl ${feature.lightColor} flex items-center justify-center mb-5`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div
                  className={`absolute inset-x-0 bottom-0 h-1 rounded-b-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Quy trình
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Quy trình đặt hàng đơn giản
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Chỉ 4 bước từ khi tạo đơn đến khi nhận nguyên liệu tại cửa hàng.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflows.map((item, index) => (
              <div key={index} className="relative text-center">
                {/* Connecting line */}
                {index < workflows.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
                )}

                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-primary-foreground mb-6 shadow-lg shadow-primary/20">
                  <item.icon className="w-8 h-8" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ACCOUNTS / ROLES ========== */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Vai trò
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Mỗi vai trò, một trải nghiệm riêng
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Đăng nhập bằng tài khoản tương ứng để trải nghiệm hệ thống theo vai trò của bạn.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Store,
                role: "Nhân viên Cửa hàng",
                email: "staff@centralkitchen.vn",
                desc: "Tạo đơn hàng, kiểm tra tồn kho, theo dõi giao nhận.",
                color: "from-orange-500 to-amber-500",
                lightBg: "bg-orange-50",
                iconColor: "text-orange-600",
                available: true,
              },
              {
                icon: Truck,
                role: "Điều phối Cung ứng",
                email: "coordinator@centralkitchen.vn",
                desc: "Xét duyệt đơn hàng, phân phối và điều phối vận chuyển.",
                color: "from-blue-500 to-cyan-500",
                lightBg: "bg-blue-50",
                iconColor: "text-blue-600",
                available: false,
              },
              {
                icon: ChefHat,
                role: "Nhân viên Bếp TT",
                email: "kitchen@centralkitchen.vn",
                desc: "Nhận đơn sản xuất, cập nhật tiến độ chế biến.",
                color: "from-purple-500 to-pink-500",
                lightBg: "bg-purple-50",
                iconColor: "text-purple-600",
                available: false,
              },
              {
                icon: Users,
                role: "Quản lý",
                email: "manager@centralkitchen.vn",
                desc: "Tổng quan hệ thống, báo cáo và quản lý người dùng.",
                color: "from-emerald-500 to-green-500",
                lightBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                available: false,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Top gradient bar */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.color}`}
                />

                <div
                  className={`w-12 h-12 rounded-xl ${item.lightBg} flex items-center justify-center mb-4`}
                >
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>

                <h3 className="font-bold text-foreground mb-1">{item.role}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {item.desc}
                </p>

                <div className="p-3 rounded-lg bg-muted/70 mb-4">
                  <p className="text-xs text-muted-foreground mb-0.5">Tài khoản demo</p>
                  <p className="text-sm font-mono font-medium text-foreground">
                    {item.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mật khẩu: <span className="font-mono font-medium text-foreground">123456</span>
                  </p>
                </div>

                {item.available ? (
                  <Link to="/login" className="block">
                    <Button size="sm" className="w-full gap-2">
                      Đăng nhập
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    Sắp ra mắt
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Đánh giá
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Được tin dùng bởi đội ngũ vận hành
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-6">
                  &ldquo;{item.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 login-hero-gradient" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

            <div className="relative z-10 text-center py-20 px-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Sẵn sàng tối ưu vận hành?
              </h2>
              <p className="mt-4 text-lg text-white/70 max-w-xl mx-auto">
                Đăng nhập ngay để trải nghiệm hệ thống quản lý Bếp Trung Tâm và Chuỗi Franchise.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <Link to="/login">
                  <Button
                    size="lg"
                    className="gap-2 text-base px-8 h-12 bg-white text-foreground hover:bg-white/90"
                  >
                    Đăng nhập ngay
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">CentralKitchen</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">
                Tính năng
              </a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">
                Quy trình
              </a>
              <a href="#testimonials" className="hover:text-foreground transition-colors">
                Đánh giá
              </a>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Đăng nhập
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2026 CentralKitchen. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
