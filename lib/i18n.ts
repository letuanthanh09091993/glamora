import { UserRole } from "@/lib/auth-types";

export const LANGUAGES = ["VN", "EN"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "VN";

const translations = {
  VN: {
    common: {
      appName: "Glamora",
      loading: "Đang tải...",
      backHome: "Về trang chủ",
      saveChanges: "Lưu thay đổi",
      login: "Đăng nhập",
      logout: "Đăng xuất",
      createAccount: "Tạo tài khoản",
      account: "Tài khoản",
      publicProfile: "Hồ sơ công khai",
      pleaseWait: "Vui lòng chờ...",
      language: "Ngôn ngữ",
    },
    authShell: {
      eyebrow: "Glamora",
      headlineLine1: "Nền tảng làm đẹp",
      headlineLine2: "cao cấp dành riêng cho bạn",
      description:
        "Onboarding bảo mật với trải nghiệm theo vai trò cho artist, khách hàng và người mẫu.",
    },
    home: {
      marketplace: "Sàn Kết Nối Làm Đẹp Glamora",
      titleLine1: "Tìm Chuyên Viên",
      titleLine2: "Trang Điểm Phù Hợp Nhất",
      description:
        "Kết nối với các makeup artist tài năng gần bạn cho cưới hỏi, sự kiện, chụp ảnh và làm đẹp hằng ngày.",
      heroPrimary: "Khám phá chuyên viên",
      heroSecondary: "Trở thành Makeup Artist",
      featuredArtists: "Chuyên Viên Nổi Bật",
      viewAll: "Xem Tất Cả",
      artistLabel: "Chuyên viên",
      artistServices: "Cô dâu • Thời trang • Trang điểm tự nhiên",
      fromPrice: "Từ $80",
      bookNow: "Đặt Lịch",
      ctaTitle: "Sẵn sàng cho diện mạo rạng rỡ tiếp theo?",
      ctaDescription: "Khám phá các chuyên viên làm đẹp tài năng trên khắp Việt Nam.",
      startBooking: "Bắt Đầu Đặt Lịch",
    },
    signup: {
      title: "Tạo tài khoản mới",
      subtitle: "Bắt đầu hành trình Glamora với trải nghiệm theo đúng vai trò của bạn.",
      footerText: "Đã có tài khoản?",
      footerLinkLabel: "Đăng nhập",
      username: "Tên người dùng",
      usernamePlaceholder: "tenban",
      password: "Mật khẩu",
      passwordPlaceholder: "Ít nhất 6 ký tự",
      phoneNumber: "Số điện thoại",
      phonePlaceholder: "+84...",
      selectRole: "Chọn vai trò của bạn",
      submit: "Tạo tài khoản",
      fixErrors: "Vui lòng sửa các lỗi xác thực trước.",
      usernameMin: "Tên người dùng cần ít nhất 3 ký tự.",
      passwordMin: "Mật khẩu cần ít nhất 6 ký tự.",
      phoneInvalid: "Định dạng số điện thoại không hợp lệ.",
    },
    login: {
      title: "Chào mừng quay lại",
      subtitle: "Đăng nhập để tiếp tục quản lý hành trình làm đẹp của bạn.",
      footerText: "Chưa có tài khoản?",
      footerLinkLabel: "Tạo tài khoản",
      username: "Tên người dùng",
      usernamePlaceholder: "tenban",
      password: "Mật khẩu",
      passwordPlaceholder: "Mật khẩu bảo mật của bạn",
      submit: "Đăng nhập",
    },
    roles: {
      customer: {
        label: "Khách hàng tìm makeup artist",
        short: "Khách hàng",
        description: "Tìm và đặt artist cao cấp, lưu yêu thích và lịch sử booking.",
      },
      makeup_artist: {
        label: "Makeup Artist",
        short: "Makeup Artist",
        description: "Trưng bày portfolio, dịch vụ, giá, đánh giá và nhận xét.",
      },
      model: {
        label: "Người mẫu",
        short: "Model",
        description: "Xây dựng hồ sơ, ảnh cá nhân, thông tin chi tiết và gu cộng tác.",
      },
      artist_looking_model: {
        label: "Makeup Artist tìm người mẫu",
        short: "Artist tìm model",
        description: "Đăng casting và tìm người mẫu phù hợp để cộng tác.",
      },
    },
    dashboard: {
      eyebrow: "Bảng điều khiển Glamora",
      signedInAs: "Đăng nhập với tư cách",
      customerTitle: "Trải nghiệm khách hàng",
      artistTitle: "Studio Makeup Artist",
      modelTitle: "Trung tâm hồ sơ model",
      castingTitle: "Trung tâm cộng tác casting",
      sectionQuickActions: "Thao tác nhanh",
      sectionArtistCapabilities: "Năng lực artist",
      sectionModelCapabilities: "Năng lực model",
      sectionCastingCapabilities: "Năng lực casting",
      customerCards: {
        favoritesTitle: "Nghệ sĩ yêu thích",
        favoritesValue: "12 đã lưu",
        historyTitle: "Lịch sử đặt lịch",
        historyValue: "4 lịch hẹn đã hoàn thành",
        upcomingTitle: "Lịch sắp tới",
        upcomingValue: "1 lịch trong tuần này",
      },
      customerItems: {
        one: "Khám phá makeup artist cao cấp theo phong cách và vị trí",
        two: "Lưu nghệ sĩ yêu thích để đặt nhanh hơn",
        three: "Quản lý timeline đặt lịch và chi tiết dịch vụ",
      },
      artistCards: {
        completionTitle: "Mức độ hoàn thiện hồ sơ",
        completionValue: "82%",
        assetsTitle: "Tài sản portfolio",
        assetsValue: "24 ảnh · 3 video",
        ratingTitle: "Đánh giá trung bình",
        ratingValue: "4.9 ★",
        servicesTitle: "Dịch vụ đang mở",
        servicesValue: "6 gói dịch vụ",
      },
      artistItems: {
        one: "Quản lý avatar, ảnh portfolio và video ngắn làm đẹp",
        two: "Cập nhật chuyên môn makeup, giá, dịch vụ và địa điểm",
        three: "Hiển thị đánh giá và nhận xét công khai trên hồ sơ",
      },
      modelCards: {
        portfolioTitle: "Portfolio",
        portfolioValue: "14 ảnh đã tải lên",
        measurementsTitle: "Số đo",
        measurementsValue: "Thông tin hồ sơ đầy đủ",
        preferenceTitle: "Phong cách cộng tác",
        preferenceValue: "Sẵn sàng cho beauty shoot",
      },
      modelItems: {
        one: "Duy trì hồ sơ model chỉn chu và hình ảnh chuyên nghiệp",
        two: "Chỉnh sửa số đo cơ thể, style tags và sở thích cộng tác",
        three: "Chọn hiển thị công khai/riêng tư cho nội dung hồ sơ",
      },
      castingCards: {
        openTitle: "Tin casting đang mở",
        openValue: "3 bài đăng đang hoạt động",
        savedTitle: "Model đã lưu",
        savedValue: "9 ứng viên tiềm năng",
        messagesTitle: "Tin nhắn mới",
        messagesValue: "2 cuộc hội thoại chưa đọc",
      },
      castingItems: {
        one: "Đăng yêu cầu casting với style, lịch và địa điểm cụ thể",
        two: "Duyệt portfolio model và chọn ứng viên phù hợp",
        three: "Bắt đầu trao đổi trực tiếp cho campaign/editorial",
      },
    },
    account: {
      title: "Cài đặt hồ sơ",
      subtitle: "Chỉnh sửa hồ sơ, quản lý hiển thị và giữ hình ảnh chuyên nghiệp.",
      backDashboard: "Về dashboard",
      avatarUrl: "URL ảnh đại diện",
      location: "Địa điểm",
      specialties: "Chuyên môn (cách nhau bằng dấu phẩy)",
      pricing: "Giá / Dịch vụ",
      bio: "Giới thiệu",
      profilePublic: "Hiển thị hồ sơ của tôi ở chế độ công khai",
    },
    profile: {
      notFound: "Không tìm thấy hồ sơ",
      privateProfile: "Hồ sơ này đang ở chế độ riêng tư",
      publicProfile: "Hồ sơ công khai",
      loginToConnect: "Đăng nhập để kết nối",
      updatingSoon: "Sẽ cập nhật sớm",
      contactForQuote: "Liên hệ để nhận báo giá",
      noReviews: "Chưa có đánh giá",
      reviewsSuffix: "đánh giá",
      bio: "Giới thiệu",
      fallbackBio: "Hồ sơ này đang được cập nhật thông tin mới.",
      location: "Địa điểm",
      pricing: "Giá / Dịch vụ",
      rating: "Đánh giá",
    },
    authMessages: {
      usernameExists: "Tên người dùng đã tồn tại.",
      phoneExists: "Số điện thoại đã tồn tại.",
      accountCreated: "Tạo tài khoản thành công.",
      invalidCredential: "Tên đăng nhập hoặc mật khẩu không đúng.",
      loginSuccess: "Đăng nhập thành công.",
      noAuthenticatedUser: "Không có người dùng đang đăng nhập.",
      userNotFound: "Không tìm thấy người dùng.",
      profileUpdated: "Cập nhật hồ sơ thành công.",
    },
    gate: {
      loadingSession: "Đang tải phiên đăng nhập của bạn...",
    },
  },
  EN: {
    common: {
      appName: "Glamora",
      loading: "Loading...",
      backHome: "Back to Home",
      saveChanges: "Save Changes",
      login: "Login",
      logout: "Logout",
      createAccount: "Create Account",
      account: "Account",
      publicProfile: "Public Profile",
      pleaseWait: "Please wait...",
      language: "Language",
    },
    authShell: {
      eyebrow: "Glamora",
      headlineLine1: "Premium beauty",
      headlineLine2: "marketplace access",
      description:
        "Secure onboarding with role-based experiences for artists, customers, and models.",
    },
    home: {
      marketplace: "Glamora Beauty Marketplace",
      titleLine1: "Find Your Perfect",
      titleLine2: "Makeup Artist",
      description:
        "Connect with talented makeup artists near you for weddings, events, photoshoots, and everyday beauty.",
      heroPrimary: "Explore Artists",
      heroSecondary: "Become an Artist",
      featuredArtists: "Featured Artists",
      viewAll: "View All",
      artistLabel: "Artist",
      artistServices: "Bridal • Fashion • Natural Makeup",
      fromPrice: "From $80",
      bookNow: "Book Now",
      ctaTitle: "Ready for your next glow up?",
      ctaDescription: "Discover talented beauty artists across Vietnam.",
      startBooking: "Start Booking",
    },
    signup: {
      title: "Create Your Account",
      subtitle: "Start your Glamora journey with a tailored role-based experience.",
      footerText: "Already have an account?",
      footerLinkLabel: "Login",
      username: "Username",
      usernamePlaceholder: "yourname",
      password: "Password",
      passwordPlaceholder: "At least 6 characters",
      phoneNumber: "Phone Number",
      phonePlaceholder: "+84...",
      selectRole: "Select your role",
      submit: "Create Account",
      fixErrors: "Please fix validation errors first.",
      usernameMin: "Username must be at least 3 characters.",
      passwordMin: "Password must be at least 6 characters.",
      phoneInvalid: "Phone number format is invalid.",
    },
    login: {
      title: "Welcome Back",
      subtitle: "Log in and continue managing your beauty marketplace journey.",
      footerText: "New to Glamora?",
      footerLinkLabel: "Create account",
      username: "Username",
      usernamePlaceholder: "yourname",
      password: "Password",
      passwordPlaceholder: "Your secure password",
      submit: "Login",
    },
    roles: {
      customer: {
        label: "Customer looking for makeup artists",
        short: "Customer",
        description: "Find and book premium artists, save favorites and history.",
      },
      makeup_artist: {
        label: "Makeup Artist",
        short: "Makeup Artist",
        description: "Showcase portfolio, services, pricing, ratings, and reviews.",
      },
      model: {
        label: "Model",
        short: "Model",
        description: "Build your profile, photos, details, and collaboration style.",
      },
      artist_looking_model: {
        label: "Makeup Artist looking for models",
        short: "Artist Seeking Model",
        description: "Post casting requests and browse model collaboration matches.",
      },
    },
    dashboard: {
      eyebrow: "Glamora Dashboard",
      signedInAs: "Signed in as",
      customerTitle: "Customer Experience",
      artistTitle: "Makeup Artist Studio",
      modelTitle: "Model Profile Hub",
      castingTitle: "Casting Collaboration Center",
      sectionQuickActions: "Quick actions",
      sectionArtistCapabilities: "Artist capabilities",
      sectionModelCapabilities: "Model capabilities",
      sectionCastingCapabilities: "Casting capabilities",
      customerCards: {
        favoritesTitle: "Favorite Artists",
        favoritesValue: "12 saved",
        historyTitle: "Booking History",
        historyValue: "4 completed bookings",
        upcomingTitle: "Upcoming Appointments",
        upcomingValue: "1 scheduled this week",
      },
      customerItems: {
        one: "Discover premium makeup artists by style and location",
        two: "Save favorites for faster re-booking",
        three: "Manage booking timeline and order details",
      },
      artistCards: {
        completionTitle: "Profile Completion",
        completionValue: "82%",
        assetsTitle: "Portfolio Assets",
        assetsValue: "24 images · 3 videos",
        ratingTitle: "Average Rating",
        ratingValue: "4.9 ★",
        servicesTitle: "Active Services",
        servicesValue: "6 packages",
      },
      artistItems: {
        one: "Manage avatar, portfolio photos, and short-form beauty reels",
        two: "Update makeup specialties, pricing, service details, and location",
        three: "Display public ratings and client reviews in profile page",
      },
      modelCards: {
        portfolioTitle: "Portfolio",
        portfolioValue: "14 photos uploaded",
        measurementsTitle: "Measurements",
        measurementsValue: "Profile details available",
        preferenceTitle: "Collaboration Style",
        preferenceValue: "Open for beauty shoots",
      },
      modelItems: {
        one: "Maintain polished model profile and visuals",
        two: "Edit body measurements, style tags, and collaboration preferences",
        three: "Share private/public visibility controls for profile content",
      },
      castingCards: {
        openTitle: "Open Casting Requests",
        openValue: "3 live posts",
        savedTitle: "Saved Models",
        savedValue: "9 potential collaborators",
        messagesTitle: "New Conversations",
        messagesValue: "2 unread threads",
      },
      castingItems: {
        one: "Post casting requests with style, schedule, and location requirements",
        two: "Browse model portfolios and shortlist ideal collaboration matches",
        three: "Start direct conversations for campaign and editorial projects",
      },
    },
    account: {
      title: "Profile Settings",
      subtitle: "Edit your profile, manage visibility, and keep your presence premium.",
      backDashboard: "Back to Dashboard",
      avatarUrl: "Avatar URL",
      location: "Location",
      specialties: "Specialties (comma separated)",
      pricing: "Pricing / Services",
      bio: "Bio / Introduction",
      profilePublic: "Make my profile public",
    },
    profile: {
      notFound: "Profile not found",
      privateProfile: "This profile is private",
      publicProfile: "Public Profile",
      loginToConnect: "Login to Connect",
      updatingSoon: "Updating soon",
      contactForQuote: "Contact for quote",
      noReviews: "No reviews yet",
      reviewsSuffix: "reviews",
      bio: "Bio",
      fallbackBio: "This profile is being polished with new information.",
      location: "Location",
      pricing: "Pricing / Services",
      rating: "Rating",
    },
    authMessages: {
      usernameExists: "Username already exists.",
      phoneExists: "Phone number already exists.",
      accountCreated: "Account created successfully.",
      invalidCredential: "Invalid username or password.",
      loginSuccess: "Login successful.",
      noAuthenticatedUser: "No authenticated user.",
      userNotFound: "User not found.",
      profileUpdated: "Profile updated successfully.",
    },
    gate: {
      loadingSession: "Loading your session...",
    },
  },
} as const;

type TranslationTree = (typeof translations)[Language];

export function getTranslation(language: Language) {
  return translations[language];
}

export function t(language: Language, key: string): string {
  const tree = getTranslation(language) as TranslationTree;
  const value = key
    .split(".")
    .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], tree);
  return typeof value === "string" ? value : key;
}

export function getRoleLabel(language: Language, role: UserRole) {
  return t(language, `roles.${role}.label`);
}

export function getRoleDescription(language: Language, role: UserRole) {
  return t(language, `roles.${role}.description`);
}

export function getRoleShort(language: Language, role: UserRole) {
  return t(language, `roles.${role}.short`);
}
