import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

export type Locale = "vi" | "en";

const vietnameseDictionary = {
  nav_home: "Trang chủ",
  nav_services: "Dịch vụ",
  nav_posts: "Bài viết",
  nav_gallery: "Bộ sưu tập",
  nav_tracking: "Theo dõi",
  nav_about: "Giới thiệu",
  nav_contact: "Liên hệ",
  nav_account: "Tài khoản",
  nav_login: "Đăng nhập",
  nav_logout: "Đăng xuất",
  quick_book: "Đặt ngay",
  call_now: "Gọi ngay",
  hero_kicker: "Trải nghiệm đỉnh cao tại Đà Nẵng",
  hero_title_line_1: "Bay lượn giữa",
  hero_title_line_2: "mây trời Sơn Trà",
  hero_services: "Xem gói dịch vụ",
  hero_about: "Tìm hiểu thêm",
  hero_tracking: "Tra cứu lịch đặt",
  price_from: "Giá từ",
  view_detail: "Xem chi tiết",
  read_post: "Đọc bài viết",
  loading_post: "Đang tải bài viết...",
  loading_service: "Đang tải gói dịch vụ...",
  choose_language: "Chọn ngôn ngữ",
  language_vi: "Tiếng Việt",
  language_en: "English",
  syncing_translation: "Đang đồng bộ bản dịch..."
} as const;

const englishDictionary: Record<keyof typeof vietnameseDictionary, string> = {
  nav_home: "Home",
  nav_services: "Services",
  nav_posts: "Posts",
  nav_gallery: "Gallery",
  nav_tracking: "Tracking",
  nav_about: "About",
  nav_contact: "Contact",
  nav_account: "Account",
  nav_login: "Log in",
  nav_logout: "Log out",
  quick_book: "Book now",
  call_now: "Call now",
  hero_kicker: "A premium experience in Da Nang",
  hero_title_line_1: "Glide through",
  hero_title_line_2: "the Son Tra sky",
  hero_services: "View packages",
  hero_about: "Learn more",
  hero_tracking: "Check booking",
  price_from: "From",
  view_detail: "View details",
  read_post: "Read post",
  loading_post: "Loading post...",
  loading_service: "Loading service package...",
  choose_language: "Choose language",
  language_vi: "Vietnamese",
  language_en: "English",
  syncing_translation: "Syncing translation..."
};

const staticTextDictionary: Record<string, string> = {
  "Dù lượn Đà Nẵng": "Da Nang Paragliding",
  "Logo Dù lượn Đà Nẵng": "Da Nang Paragliding logo",
  "Dù lượn tại Đà Nẵng": "Paragliding in Da Nang",
  "ĐÀ NẴNG": "DA NANG",
  "Dù lượn": "Paragliding",
  "Trải nghiệm cảm giác tự do bay lượn trên bầu trời Đà Nẵng, ngắm nhìn vẻ đẹp của bán đảo Sơn Trà từ trên cao.":
    "Experience the freedom of flying over Da Nang and admire the beauty of Son Tra Peninsula from above.",
  "Liên kết": "Links",
  "Liên hệ": "Contact",
  "Theo dõi": "Follow",
  "Bán đảo Sơn Trà, Đà Nẵng": "Son Tra Peninsula, Da Nang",
  "Công viên Biển Đông, đường Võ Nguyên Giáp, phường Phước Mỹ, Sơn Trà, Đà Nẵng":
    "East Sea Park, Vo Nguyen Giap Street, Phuoc My Ward, Son Tra, Da Nang",

  "Về chúng tôi": "About us",
  "Giới thiệu": "About",
  "Ảnh giới thiệu": "About image",
  "Doanh nghiệp dù lượn vận hành theo hướng dịch vụ rõ ràng và an toàn là ưu tiên.":
    "A paragliding business operated around clear service and safety first.",
  "Phía khách hàng được kết nối trực tiếp với quy trình đặt lịch, theo dõi hành trình và vận hành thực tế của đội ngũ.":
    "Customers are connected directly to the booking process, journey tracking, and the team's real operations.",
  "Câu chuyện doanh nghiệp": "Business story",
  "Chúng tôi tập trung vào đặt lịch minh bạch, lịch rõ ràng và trải nghiệm an toàn.":
    "We focus on transparent booking, clear schedules, and a safe experience.",
  "Toàn bộ luồng được thiết kế để khách hàng có thể xem lịch trống, đặt lịch, thanh toán và theo dõi hành trình mà không cần phải chờ qua nhiều thao tác thủ công.":
    "The whole flow is designed so customers can view availability, book, pay, and track the journey without waiting through many manual steps.",
  "An toàn ưu tiên": "Safety first",
  "Quy trình kiểm tra, chọn giờ bay và phân công phi công được thực hiện trước mỗi lịch đặt.":
    "Checks, flight time selection, and pilot assignment are completed before each booking.",
  "Vận hành rõ ràng": "Clear operations",
  "Khách, quản trị viên và phi công đều theo một luồng thông tin thống nhất trên hệ thống.":
    "Guests, administrators, and pilots all follow one consistent information flow in the system.",
  "Khoảnh khắc đáng nhớ": "Memorable moments",
  "Hình ảnh và video chuyến bay là một phần của trải nghiệm, không phải phần phụ.":
    "Flight photos and videos are part of the experience, not an add-on.",
  "Đội ngũ vận hành": "Operations team",
  "Chuyến bay": "Flight",
  "Điểm nổi bật vận hành": "Operational highlights",
  "Phi công có chứng chỉ và được quản trị viên gán theo lịch đặt đã xác nhận.":
    "Certified pilots are assigned by administrators for confirmed bookings.",
  "Nhân sự điều phối cập nhật khung giờ đã đầy, thời tiết và trạng thái chuyến bay theo ngày.":
    "Coordinators update full time slots, weather, and flight status by day.",
  "Khách nhận mã đặt lịch rõ ràng, email xác nhận và kênh liên hệ trực tiếp.":
    "Guests receive a clear booking code, confirmation email, and direct contact channel.",
  "Đội ngũ hướng dẫn viên": "Guide team",
  "Những người trực tiếp vận hành chuyến bay": "The people directly operating the flight",
  "Phi công bay đôi đã được huấn luyện và vận hành bay đôi thương mại.":
    "Tandem pilots are trained and experienced in commercial tandem flights.",
  "Điều phối viên theo dõi thời tiết, khung giờ và lưu lượng đặt lịch theo ngày.":
    "Coordinators monitor weather, time slots, and booking volume by day.",
  "Nhân sự media hỗ trợ giao ảnh và video sau chuyến bay.": "Media staff help deliver photos and videos after the flight.",
  "Chứng nhận an toàn": "Safety certification",
  "Hệ thống checklist và thông tin đồng bộ": "Checklist system and synced information",
  "Checklist thiết bị trước cất cánh và sau hạ cánh.": "Equipment checklist before takeoff and after landing.",
  "Briefing an toàn, cân nặng và điều kiện sức khỏe được xác nhận trước giờ bay.":
    "Safety briefing, weight, and health conditions are confirmed before the flight.",
  "Thông tin lộ trình, thời tiết và trạng thái chuyến bay được cập nhật để khách theo dõi lại dễ dàng.":
    "Route, weather, and flight status information is updated so guests can track it easily.",
  "Phông nền dù lượn": "Paragliding background",
  "CHINH PHỤC BẦU TRỜI ĐÀ NẴNG": "CONQUER THE DA NANG SKY",
  "Chúng tôi là đơn vị hàng đầu cung cấp dịch vụ bay dù lượn đôi tại Đà Nẵng. Với sứ mệnh mang đến trải nghiệm bay an toàn và đầy cảm xúc, chúng tôi đã đồng hành cùng hàng ngàn du khách chinh phục bầu trời Sơn Trà.":
    "We are a leading tandem paragliding operator in Da Nang. With a mission to deliver safe and emotional flying experiences, we have accompanied thousands of visitors in conquering the Son Tra sky.",
  "Xem chi tiết về chúng tôi": "View more about us",
  "Phi công chuyên nghiệp": "Professional pilots",
  "Đội ngũ phi công 500+ giờ bay thực tế tại Sơn Trà, đồng hành an toàn trong suốt hành trình.":
    "Pilots with 500+ real flight hours at Son Tra, accompanying you safely throughout the journey.",
  "Miễn phí trung chuyển": "Free transfer",
  "Đón tận nơi trong nội thành Đà Nẵng và đưa đến điểm bay để bạn không phải lo di chuyển.":
    "Pickup inside Da Nang city and transfer to the flight site so you do not need to worry about transport.",
  "Lưu giữ khoảnh khắc": "Capture the moment",
  "Quay video GoPro 4K, chụp ảnh flycam và lưu lại trọn vẹn chuyến bay đáng nhớ.":
    "Record 4K GoPro video, capture drone photos, and keep the full memory of your flight.",
  "Đảm bảo an toàn": "Safety assured",
  "Trang bị hiện đại, quy trình kiểm tra kỹ lưỡng và bảo hiểm cho từng khách hàng.":
    "Modern equipment, careful safety checks, and insurance for every guest.",
  "Chưa có dữ liệu thời tiết": "No weather data yet",
  "Hệ thống đang chờ dữ liệu dự báo cho tháng này.": "The system is waiting for this month's forecast data.",
  "Bạn vẫn có thể xem danh sách gói bay và quay lại sau để chọn lịch phù hợp.":
    "You can still browse flight packages and come back later to choose a suitable schedule.",
  "Gói Tour Nổi Bật": "Featured Tour Packages",
  "Khám phá các lựa chọn bay dù lượn hàng đầu tại Đà Nẵng, được thiết kế để mang lại trải nghiệm tốt nhất.":
    "Explore top paragliding options in Da Nang, designed to deliver the best experience.",
  "Tạm thời chưa mở bán": "Temporarily unavailable",
  "Hiện tại chưa có gói dịch vụ hoạt động để hiển thị.": "There are no active service packages to show right now.",
  "Hãy liên hệ": "Please contact",
  "để được tư vấn lịch bay phù hợp.": "for advice on a suitable flight schedule.",
  "Xem tất cả các gói": "View all packages",
  "Video trải nghiệm dù lượn": "Paragliding experience video",
  "Xem trên YouTube": "Watch on YouTube",
  "Trải nghiệm thực tế": "Real experience",
  "Tin Tức Mới Nhất": "Latest News",
  "Cập nhật những thông tin, kinh nghiệm và câu chuyện thú vị về dù lượn.":
    "Updates, tips, and interesting stories about paragliding.",
  "Xem tất cả bài viết": "View all posts",
  "Bài viết": "Posts",
  "Blog đang được cập nhật.": "The blog is being updated.",
  "Khi quản trị viên đăng bài mới, khách hàng và phi công sẽ thấy nội dung tại đây.":
    "When administrators publish new posts, customers and pilots will see them here.",

  "Tin tức & Hoạt động": "News & Activities",
  "Cập nhật những thông tin mới nhất về hoạt động bay dù lượn tại Đà Nẵng.":
    "Latest updates about paragliding activities in Da Nang.",
  "Dịch vụ bay dù lượn": "Paragliding Services",
  "Khám phá các gói tour đa dạng, phù hợp với mọi nhu cầu và ngân sách của bạn.":
    "Explore diverse tour packages for your needs and budget.",
  "Các gói tour có sẵn": "Available Packages",
  "Chọn trải nghiệm dù lượn hoàn hảo cho chuyến phiêu lưu của bạn.":
    "Choose the perfect paragliding experience for your adventure.",
  "Chưa có gói hoạt động": "No active packages",
  "Danh sách dịch vụ đang được cập nhật.": "The service list is being updated.",
  "Khách vẫn có thể liên hệ hotline để đặt lịch thủ công trong khi chờ hệ thống mở lịch.":
    "Guests can still contact the hotline to book manually while waiting for online scheduling.",

  "Thời tiết": "Weather",
  "Thời tiết hôm nay": "Today's Weather",
  "Điều kiện bay": "Flight condition",
  "Điều kiện bay:": "Flight condition:",
  "Điều kiện lý tưởng cho một chuyến bay tuyệt vời.": "Ideal conditions for a great flight.",
  "Nên theo dõi thêm trước khi chốt lịch bay.": "Please monitor conditions further before confirming your flight.",
  "Thời tiết đang ổn định và có thể theo dõi thêm để chọn giờ đẹp.":
    "The weather is stable; keep monitoring to choose the best time.",
  "Bay dù lượn tại Sơn Trà": "Paragliding at Son Tra",
  "Sức gió": "Wind speed",
  "Chỉ số UV": "UV index",
  "Nhiệt độ": "Temperature",
  "Tầm nhìn": "Visibility",
  "Sơn Trà": "Son Tra",
  "Đang cập nhật": "Updating",
  "Đặt lịch ngay": "Book now",
  "An toàn là ưu tiên hàng đầu của chúng tôi": "Safety is our top priority",
  "Dự báo thời tiết": "Weather Forecast",
  "Lý tưởng": "Ideal",
  "Không lý tưởng": "Not ideal",
  "Trời quang": "Clear sky",
  "Ít mây": "Mostly clear",
  "Mây rải rác": "Partly cloudy",
  "Nhiều mây": "Cloudy",
  "Sương mù": "Fog",
  "Sương mù đóng băng": "Freezing fog",
  "Mưa phùn nhẹ": "Light drizzle",
  "Mưa phùn": "Drizzle",
  "Mưa phùn mạnh": "Heavy drizzle",
  "Mưa nhẹ": "Light rain",
  "Mưa vừa": "Moderate rain",
  "Mưa lớn": "Heavy rain",
  "Mưa rào nhẹ": "Light showers",
  "Mưa rào": "Showers",
  "Mưa rào mạnh": "Heavy showers",
  "Giông": "Thunderstorm",
  "Giông kèm mưa đá": "Thunderstorm with hail",
  "Giông kèm mưa đá mạnh": "Heavy thunderstorm with hail",
  "Nắng": "Sunny",
  "Nhiều nắng": "Mostly sunny",
  "Có mây": "Cloudy",
  "Có mây từng phần": "Partly cloudy",
  "U ám": "Overcast",
  "Mưa gần đó": "Patchy rain nearby",
  "Mưa rào gần đó": "Patchy showers nearby",

  "Dự báo": "Forecast",
  "Ngày": "Date",
  "Chưa có dữ liệu thời tiết cho lịch bay này": "No weather data for this flight schedule",

  "Liên Hệ": "Contact",
  "Liên Hệ Với Chúng Tôi": "Contact Us",
  "Bạn có thắc mắc hoặc muốn đặt lịch bay? Hãy liên hệ với chúng tôi qua các kênh dưới đây.":
    "Have questions or want to book a flight? Contact us through the channels below.",
  "Bạn có thắc mắc hoặc muốn đặt lịch bay? Hãy liên hệ với chúng tôi qua các kênh dưới đây hoặc để lại lời nhắn.":
    "Have questions or want to book a flight? Contact us through the channels below or leave a message.",
  "Địa chỉ": "Address",
  "Bản đồ liên hệ Dù lượn Đà Nẵng": "Da Nang Paragliding contact map",

  "Bộ sưu tập": "Gallery",
  "Xem": "View",
  "ảnh": "photo",
  "Chưa có ảnh hoặc video để hiển thị.": "No photos or videos to display.",
  "Khi thêm ảnh hoặc video cho frontend, thư viện sẽ hiện tại đây.": "When photos or videos are added, they will appear here.",
  "Đang tải thêm nội dung...": "Loading more content...",
  "Đóng trình xem media": "Close media viewer",
  "Xem media trước": "Previous media",
  "Xem media tiếp theo": "Next media",
  "Ảnh theo dõi hành trình": "Journey tracking photo",
  "Chuyến bay bình minh": "Sunrise flight",
  "Rừng Sơn Trà": "Son Tra forest",
  "Hoàng hôn vàng": "Golden sunset",

  "Đăng nhập bằng email": "Log in with email",
  "Nhập email, Dù lượn Đà Nẵng sẽ gửi liên kết xác thực. Không cần mật khẩu và không cần đăng ký riêng.":
    "Enter your email and Da Nang Paragliding will send a verification link. No password or separate signup needed.",
  "Email là bắt buộc.": "Email is required.",
  "Email không hợp lệ.": "Invalid email.",
  "Đang gửi link...": "Sending link...",
  "Gửi link xác thực": "Send verification link",
  "Email đã được xác thực. Đang chuyển vào tài khoản...": "Email verified. Redirecting to your account...",
  "Link xác thực không hợp lệ": "Invalid verification link",
  "Email đã được xác thực": "Email verified",
  "Không thể xác thực email": "Unable to verify email",
  "Đang xác thực email": "Verifying email",
  "Token xác thực bị thiếu. Hãy mở đúng liên kết mới nhất trong email Dù lượn Đà Nẵng.":
    "The verification token is missing. Please open the latest link from your Da Nang Paragliding email.",
  "Tài khoản của bạn đã sẵn sàng. Hệ thống sẽ chuyển về trang chủ trong giây lát.":
    "Your account is ready. The system will return to the homepage shortly.",
  "Vui lòng đợi trong khi chúng tôi kích hoạt tài khoản của bạn.":
    "Please wait while we activate your account.",
  "Về trang chủ": "Back to home",
  "Gửi lại link xác thực": "Resend verification link",

  "Theo dõi hành trình": "Track Journey",
  "Nhập email của bạn để xem trạng thái chuyến bay hiện tại.":
    "Enter your email to view your current flight status.",
  "Email hoặc số điện thoại": "Email or phone number",
  "Nhập email đã đặt lịch...": "Enter the email used for booking...",
  "Đang tra cứu...": "Searching...",
  "Tra cứu lịch đặt": "Search booking",
  "Đang tra cứu": "Searching",
  "Đang tra cứu lịch đặt...": "Searching for booking...",
  "Hệ thống đang lấy dòng thời gian và vị trí GPS mới nhất.":
    "The system is retrieving the latest timeline and GPS location.",
  "Quay lại tra cứu": "Back to search",
  "Email khách": "Guest email",
  "Liên hệ doanh nghiệp": "Contact business",
  "Thông tin đặt lịch": "Booking information",
  "Mã đặt lịch": "Booking code",
  "Phê duyệt": "Approval",
  "Thanh toán": "Payment",
  "Lịch bay": "Flight schedule",
  "Điểm đón": "Pickup point",
  "Phi công": "Pilot",
  "Khách tự đến": "Self-arrival",
  "Phi công phụ trách": "Assigned pilot",
  "Lịch sử hành trình": "Journey history",
  "Bản đồ GPS": "GPS map",
  "Đang đồng bộ GPS...": "Syncing GPS...",
  "Đang cập nhật tự động": "Auto-updating",
  "Bản đồ sẽ hiển thị khi phi công bắt đầu đưa khách tới điểm bay.":
    "The map will appear when the pilot starts taking the guest to the flight site.",
  "Không còn theo dõi đoạn phi công tự di chuyển tới điểm đón, nên khách chỉ thấy GPS từ lúc đã lên xe.":
    "The pilot's private route to pickup is no longer tracked; guests only see GPS after boarding.",
  "Bản đồ sẽ hiển thị khi phi công bắt đầu theo dõi GPS.":
    "The map will appear when the pilot starts GPS tracking.",
  "Với lịch có xe đón, khách sẽ thấy GPS từ lúc phi công bắt đầu đi đón khách.":
    "For bookings with pickup, guests will see GPS once the pilot starts heading to pick them up.",
  "Nhập thông tin đặt lịch để hiển thị dòng thời gian và vị trí GPS.":
    "Enter booking information to display the timeline and GPS location.",
  "Ngay sau khi khách hàng đặt lịch thành công, lịch đặt có thể được tra cứu lại từ trang này.":
    "After a successful booking, guests can look it up again from this page.",

  "Hồ sơ cá nhân": "Personal profile",
  "Họ và tên": "Full name",
  "Số điện thoại": "Phone number",
  "Họ và tên là bắt buộc.": "Full name is required.",
  "Họ và tên phải có ít nhất 2 ký tự.": "Full name must have at least 2 characters.",
  "Số điện thoại là bắt buộc.": "Phone number is required.",
  "Số điện thoại không hợp lệ.": "Invalid phone number.",
  "Đã lưu thông tin thành công.": "Information saved successfully.",
  "Đang lưu...": "Saving...",
  "Lưu thông tin": "Save information",
  "Lịch sử đặt lịch": "Booking history",
  "Chưa có lịch đặt nào trong tài khoản này.": "There are no bookings in this account.",
  "Hãy chọn một gói dịch vụ và đặt lịch để bắt đầu lưu lịch sử đặt lịch.":
    "Choose a service package and book to start saving booking history.",
  "Xem chi tiết đặt lịch": "View booking details",
  "Ghi chú hỗ trợ": "Support notes",
  "Cập nhật đúng số điện thoại để doanh nghiệp liên hệ nhanh khi cần đổi lịch.":
    "Keep your phone number accurate so the business can contact you quickly if the schedule changes.",
  "Mỗi lịch đặt sẽ lưu mã, trạng thái thanh toán và tình trạng chuyến bay.":
    "Each booking stores its code, payment status, and flight status.",
  "Nếu cần hỗ trợ gấp, khách có thể gọi trực tiếp trong khung giờ hỗ trợ.":
    "For urgent support, guests can call directly during support hours.",

  "Tóm tắt đặt lịch": "Booking summary",
  "Dịch vụ": "Service",
  "Ngày bay": "Flight date",
  "Khung giờ": "Time slot",
  "Giá trị tour": "Tour value",
  "Xe đón": "Pickup vehicle",
  "Tổng giá trị": "Total value",
  "Cần trả trước": "Deposit required",
  "Dịch vụ đi kèm": "Included services",
  "Tự đến": "Self-arrival",
  "Di chuyển đến điểm bay": "Travel to flight site",
  "Tự đến điểm hẹn": "Go to meeting point",
  "Khách tự di chuyển đến khu vực Chùa Bửu Đài Sơn.": "Guests travel to the Buu Dai Son Pagoda area themselves.",
  "Xe đến đón": "Pickup service",
  "Cộng thêm 50.000 VND vào tiền trả trước.": "Adds 50,000 VND to the upfront payment.",
  "Địa chỉ đón": "Pickup address",
  "Nhập khách sạn, homestay, số nhà tại Đà Nẵng": "Enter hotel, homestay, or address in Da Nang",
  "Nhập địa chỉ đón.": "Enter pickup address.",
  "Đang tìm gợi ý gần Đà Nẵng...": "Finding suggestions near Da Nang...",
  "Đang định vị...": "Locating...",
  "Dùng địa chỉ này": "Use this address",
  "Đã xác nhận điểm đón": "Pickup point confirmed",
  "Xác nhận điểm đón": "Confirm pickup point",
  "Hãy hiển thị và xác nhận điểm đón trên bản đồ.": "Please show and confirm the pickup point on the map.",
  "Phương thức thanh toán": "Payment method",
  "Đang gửi đặt lịch...": "Submitting booking...",
  "Xác nhận đặt lịch": "Confirm booking",
  "Đặt lịch thành công.": "Booking successful.",
  "Đặt lịch thành công. Mã đặt lịch": "Booking successful. Booking code",
  "Đang chuyển sang bước thanh toán đặt cọc...": "Redirecting to deposit payment...",
  "Tiền trả trước gồm": "The upfront payment includes",
  "giá trị tour và phí xe đón nếu khách chọn xe đến đón.": "of the tour value and pickup fee if the guest chooses pickup.",
  "Thông tin liên hệ được lấy từ tài khoản. Nếu cần chỉnh sửa, hãy cập nhật trong trang tài khoản.":
    "Contact information is taken from your account. Update it on the account page if needed.",
  "Tôi đồng ý điều khoản bay, điều kiện sức khỏe và chính sách hoàn hủy lịch đặt của doanh nghiệp.":
    "I agree to the flight terms, health requirements, and the company's cancellation policy.",
  "Chọn đúng ghim như app gọi xe. Nếu cần, bấm vào bản đồ để chỉnh lại vị trí rồi xác nhận điểm đón.":
    "Choose the correct pin like a ride-hailing app. If needed, tap the map to adjust the pickup point, then confirm it.",
  "Bấm vào vị trí khác trên bản đồ để chỉnh điểm đón chính xác.": "Tap another location on the map to adjust the pickup point accurately.",
  "payOS": "payOS",
  "Thanh toán đặt cọc qua payOS bằng QR hoặc cổng thanh toán.": "Pay the deposit through payOS by QR or payment gateway.",

  "Chưa chọn khung giờ": "No time slot selected",
  "Lịch đã chọn:": "Selected schedule:",
  "Có thể đặt ngay và chọn lịch bên dưới": "You can book now and choose a schedule below",
  "Đặt lịch": "Booking",
  "Chưa mở lịch": "Schedule not open yet",
  "Tháng này chưa có khung giờ khả dụng cho gói bay này.": "There are no available time slots for this package this month.",
  "Bạn có thể đổi sang tháng khác hoặc liên hệ doanh nghiệp để được hỗ trợ.":
    "You can switch to another month or contact the business for support.",
  "Tổng quan": "Overview",
  "Giá gói": "Package price",
  "Lưu ý khi tham gia": "Participation notes",
  "Sức khỏe tốt, không mắc các bệnh về tim mạch, huyết áp.": "Good health, with no cardiovascular or blood pressure conditions.",
  "Cân nặng từ 30kg đến 90kg.": "Weight from 30kg to 90kg.",
  "Trang phục gọn gàng, nên đi giày thể thao.": "Wear neat clothing and sports shoes.",
  "Tuân thủ tuyệt đối hướng dẫn của phi công.": "Follow the pilot's instructions strictly.",
  "Thời gian bay có thể thay đổi tùy thuộc vào điều kiện sức gió.": "Flight time may change depending on wind conditions.",

  "Bay:": "Flight:",
  "Trời nắng nhẹ": "Light sunshine",
  "Độ ẩm:": "Humidity:",
  "Xem tất cả": "View all",

  "Chưa có dữ liệu khả dụng cho tháng này.": "No available data for this month.",
  "Trống": "Available",
  "Đã đầy": "Full",

  "Thiếu thông tin đặt lịch": "Missing booking information",
  "Hãy chọn một gói dịch vụ trước khi đặt lịch.": "Please choose a service package before booking.",
  "Quay lại danh sách dịch vụ": "Back to service list",
  "Bắt buộc đăng nhập": "Login required",
  "Đăng nhập để tiếp tục đặt lịch": "Log in to continue booking",
  "Hệ thống sẽ tự động điền email, số điện thoại và lưu lịch sử đặt lịch vào tài khoản của bạn.":
    "The system will automatically fill in your email and phone number and save booking history to your account.",
  "Đăng nhập ngay": "Log in now",
  "Thông tin hành khách": "Passenger information",
  "Hoàn tất biểu mẫu đặt lịch": "Complete the booking form",
  "Khách có thể đổi ngày, khung giờ và xem thời tiết theo giờ bằng overlay ngay trên ô lịch đang hover.":
    "Guests can change the date and time slot and view hourly weather in an overlay on the hovered calendar cell.",
  "Chọn lại lịch nếu cần": "Choose another schedule if needed",
  "Lịch bay và thời tiết theo giờ": "Flight schedule and hourly weather",
  "Ô trống có thể đặt. Ô X đã hết phi công hoặc bị khóa. Lịch chỉ hiển thị từ ngày hiện tại trở đi.":
    "Empty cells can be booked. X cells are full or locked. The calendar only shows dates from today onward.",
  "Quy tắc đặt lịch": "Booking rules",
  "Không thể đặt vào ngày đầy hoặc khung giờ đã kín.": "You cannot book full dates or fully booked time slots.",
  "Số trẻ em phải phù hợp độ tuổi tối thiểu của gói bay.": "The number of children must match the package's minimum age rules.",
  "Sau khi gửi lịch đặt, khung giờ sẽ được giữ theo logic thanh toán của hệ thống.":
    "After submitting a booking, the time slot is held according to the system's payment logic.",
  "Hãy chọn một ô còn trống trên lịch trước khi điền biểu mẫu đặt lịch.":
    "Please choose an available calendar cell before filling in the booking form.",
  "Thông tin thời tiết theo giờ sẽ hiện dạng overlay ngay trên ô lịch khi trỏ vào từng khung giờ.":
    "Hourly weather information will appear as an overlay on the calendar cell when hovering over each time slot.",

  "Đăng nhập": "Log in",
  "Link xác thực đã được gửi. Nếu bạn mở link trên điện thoại, màn hình này sẽ tự động vào tài khoản sau khi email được xác thực.":
    "The verification link has been sent. If you open it on your phone, this screen will automatically enter your account after the email is verified.",
  "Link xác thực đã hết hạn.": "The verification link has expired.",

  "Chi tiết đặt lịch": "Booking details",
  "Quay lại tài khoản": "Back to account",
  "Thời gian tạo đặt lịch": "Booking created at",
  "Không có ghi chú": "No notes",
  "Tổng giá trị tour": "Total tour value",
  "Hủy lịch đặt": "Cancel booking",
  "Lý do hủy": "Cancellation reason",
  "Không có lý do": "No reason provided",
  "Đang tải lịch đặt hoặc lịch đặt không tồn tại trong tài khoản này.":
    "Loading the booking, or this booking does not exist in this account.",
  "Hủy trước ngày bay 5 ngày: hoàn 100% tiền cọc. Hủy sau mốc 5 ngày: không hoàn cọc.":
    "Cancel at least 5 days before the flight date for a 100% deposit refund. After that point, the deposit is non-refundable.",
  "Đóng": "Close",
  "Đang hủy...": "Cancelling...",
  "Nhập lý do hủy lịch đặt": "Enter the cancellation reason",
  "Ngân hàng": "Bank",
  "Số tài khoản": "Account number",
  "Chủ tài khoản": "Account holder",

  "Chưa có lịch đặt": "No booking found",
  "Hãy tạo lịch đặt trước khi vào trang thanh toán.": "Please create a booking before opening the payment page.",
  "Chọn gói dịch vụ": "Choose a service package",
  "Thanh toán và xác nhận lịch đặt": "Payment and booking confirmation",
  "Sau khi thanh toán thành công, lịch đặt sẽ chuyển sang đã xác nhận và khách hàng có thể vào trang theo dõi để xem hành trình.":
    "After successful payment, the booking will be confirmed and guests can open tracking to view the journey.",
  "Hướng dẫn thanh toán": "Payment instructions",
  "Đặt lịch online sẽ hiển thị QR và nội dung chuyển khoản theo mã đặt lịch.":
    "Online booking will show the QR and transfer content for the booking code.",
  "Thanh toán thành công sẽ chuyển lịch đặt sang đã xác nhận.": "Successful payment will move the booking to confirmed.",
  "Nếu QR hết hạn, khách cần tạo lại yêu cầu thanh toán mới.":
    "If the QR expires, guests need to create a new payment request.",
  "Di chuyển": "Transport",
  "Đặt cọc bằng QR": "QR deposit",
  "Thanh toán số tiền trả trước qua cổng thanh toán. Sau khi nhà cung cấp trả về trạng thái đã thanh toán, lịch đặt sẽ được xác nhận và email xác nhận sẽ được gửi cho khách.":
    "Pay the upfront amount through the payment gateway. After the provider returns a paid status, the booking will be confirmed and a confirmation email will be sent to the guest.",
  "Số tiền đặt cọc": "Deposit amount",
  "Nội dung chuyển khoản": "Transfer content",
  "Hết hạn lúc": "Expires at",
  "Giao dịch": "Transaction",
  "Mở cổng thanh toán": "Open payment gateway",
  "QR đã hết hạn": "QR has expired",
  "Đang xử lý...": "Processing...",
  "Kiểm tra trạng thái thanh toán": "Check payment status",
  "Hệ thống chưa nhận được trạng thái đã thanh toán từ cổng thanh toán. Hãy kiểm tra lại sau khi thanh toán xong.":
    "The system has not received the paid status from the payment gateway yet. Please check again after completing payment.",
  "Theo dõi hành trình bay": "Track flight journey",

  "Số người lớn": "Adults",
  "Số trẻ em": "Children",
  "Ghi chú": "Notes",
  "Trạng thái": "Status",
  "lúc": "at",

  "Chờ xác nhận": "Waiting for confirmation",
  "Đang chờ": "Waiting",
  "Phi công đang đến điểm đón": "Pilot is going to pickup point",
  "Đang di chuyển đến điểm đón": "On the way to pickup point",
  "Đang di chuyển đến điểm bay": "On the way to flight site",
  "Bắt đầu đưa khách tới điểm bay": "Started taking the guest to the flight site",
  "Bắt đầu hành trình": "Journey started",
  "Kết thúc chuyến đi": "Journey ended",
  "Đang bay": "Flying",
  "Đã hạ cánh": "Landed",
  "Chờ duyệt": "Pending approval",
  "Đã xác nhận": "Confirmed",
  "Đã hủy": "Cancelled",
  "Chờ thanh toán": "Awaiting payment",
  "Chờ thanh toán online": "Awaiting online payment",
  "Đã thanh toán": "Paid",
  "Thanh toán thất bại": "Payment failed",
  "Đã hết hạn thanh toán": "Payment expired"
};

type DictionaryKey = keyof typeof vietnameseDictionary;

type I18nContextValue = {
  locale: Locale;
  isTranslating: boolean;
  trackTranslationTask: <T>(task: Promise<T>) => Promise<T>;
  setLocale: (value: Locale) => void;
  t: (key: DictionaryKey) => string;
  tText: (value: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const LOCALE_STORAGE_KEY = "danang-paragliding.locale";
const TRANSLATION_BUSY_TIMEOUT_MS = 15000;

const resolveInitialLocale = (): Locale => {
  if (typeof window === "undefined") {
    return "vi";
  }

  return window.localStorage.getItem(LOCALE_STORAGE_KEY) === "en" ? "en" : "vi";
};

const stripVietnamese = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const looksLikeBrokenUtf8 = (value: string) => /[\u00c2-\u00c6\u00c8-\u00cf]|(?:\u00e1[\u00ba\u00bb])/.test(value);

const tryDecodeLatin1Utf8 = (value: string) => {
  try {
    const bytes = Uint8Array.from(Array.from(value), (character) => character.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
};

const exactRepairs = new Map<string, string>([
  ["ly tuong", "Lý tưởng"],
  ["khong ly tuong", "Không lý tưởng"],
  ["dieu kien bay", "Điều kiện bay"],
  ["thoi tiet", "Thời tiết"],
  ["thoi tiet hom nay", "Thời tiết hôm nay"],
  ["du bao thoi tiet", "Dự báo thời tiết"],
  ["suc gio", "Sức gió"],
  ["tam nhin", "Tầm nhìn"],
  ["nhiet do", "Nhiệt độ"],
  ["trang thai", "Trạng thái"],
  ["gioi thieu", "Giới thiệu"],
  ["lien he", "Liên hệ"],
  ["bai viet", "Bài viết"],
  ["dang nhap", "Đăng nhập"],
  ["dang xuat", "Đăng xuất"],
  ["dat ngay", "Đặt ngay"],
  ["dat lich", "Đặt lịch"],
  ["xem chi tiet", "Xem chi tiết"],
  ["doc bai viet", "Đọc bài viết"],
  ["ma booking", "Mã đặt lịch"]
]);

const normalizedStaticTextSources = new Map(
  Object.keys(staticTextDictionary).map((source) => [stripVietnamese(source), source])
);

const normalizedStaticTextDictionary = new Map(
  Object.entries(staticTextDictionary).map(([source, translation]) => [stripVietnamese(source), translation])
);

export const repairVietnameseText = (value: string) => {
  if (!value) {
    return "";
  }

  let repaired = value;
  if (looksLikeBrokenUtf8(repaired) && Array.from(repaired).every((character) => character.charCodeAt(0) <= 255)) {
    repaired = tryDecodeLatin1Utf8(repaired);
  }

  const normalized = stripVietnamese(repaired);
  return exactRepairs.get(normalized) ?? normalizedStaticTextSources.get(normalized) ?? repaired;
};

const translateStaticText = (value: string, locale: Locale) => {
  if (locale === "vi" || !value.trim()) {
    return repairVietnameseText(value);
  }

  const repaired = repairVietnameseText(value);
  return staticTextDictionary[repaired] ?? normalizedStaticTextDictionary.get(stripVietnamese(repaired)) ?? repaired;
};

export const I18nProvider = ({ children }: PropsWithChildren) => {
  const [locale, setLocaleState] = useState<Locale>(resolveInitialLocale);
  const [translationTaskCount, setTranslationTaskCount] = useState(0);

  const trackTranslationTask = useCallback(<T,>(task: Promise<T>) => {
    setTranslationTaskCount((count) => count + 1);
    let finished = false;

    const finishTask = () => {
      if (finished) {
        return;
      }

      finished = true;
      setTranslationTaskCount((count) => Math.max(0, count - 1));
    };

    const timeoutId =
      typeof window === "undefined"
        ? null
        : window.setTimeout(() => {
            finishTask();
          }, TRANSLATION_BUSY_TIMEOUT_MS);

    return task.finally(() => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      finishTask();
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((value: Locale) => {
    setLocaleState(value);
  }, []);

  const t = useCallback(
    (key: DictionaryKey) => (locale === "en" ? englishDictionary[key] : vietnameseDictionary[key]),
    [locale]
  );

  const tText = useCallback((value: string) => translateStaticText(value, locale), [locale]);
  const isTranslating = locale === "en" && translationTaskCount > 0;

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isTranslating,
      trackTranslationTask,
      setLocale,
      t,
      tText
    }),
    [isTranslating, locale, setLocale, t, tText, trackTranslationTask]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
      {isTranslating ? (
        <div className="translation-sync-overlay" role="status" aria-live="polite" data-no-auto-translate>
          <div className="translation-sync-overlay__panel">
            <span className="translation-sync-overlay__spinner" aria-hidden="true" />
            <span>{t("syncing_translation")}</span>
          </div>
        </div>
      ) : null}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
};
