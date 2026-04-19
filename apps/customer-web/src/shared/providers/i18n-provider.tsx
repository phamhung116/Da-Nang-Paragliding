import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { languageStorage } from "@/shared/lib/storage";

export type Locale = "vi" | "en";

const dictionaries = {
  vi: {
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
    hero_tracking: "Tra cứu booking"
  },
  en: {
    nav_home: "Home",
    nav_services: "Services",
    nav_posts: "Blog",
    nav_gallery: "Gallery",
    nav_tracking: "Tracking",
    nav_about: "About",
    nav_contact: "Contact",
    nav_account: "Account",
    nav_login: "Sign in",
    nav_logout: "Sign out",
    quick_book: "Book now",
    call_now: "Call now",
    hero_kicker: "Premier paragliding in Da Nang",
    hero_title_line_1: "Fly above",
    hero_title_line_2: "the Son Tra skyline",
    hero_services: "View packages",
    hero_about: "About us",
    hero_tracking: "Track booking"
  }
} as const;

const phraseTranslations: Record<string, string> = {
  "Trang chu": "Home",
  "Dich vu": "Services",
  "Dịch vụ": "Services",
  "Bai viet": "Blog",
  "Bài viết": "Blog",
  "Bo suu tap": "Gallery",
  "Bộ sưu tập": "Gallery",
  "Theo doi": "Tracking",
  "Theo dõi": "Follow",
  "Gioi thieu": "About",
  "Giới thiệu": "About",
  "Lien he": "Contact",
  "Liên hệ": "Contact",
  "Tai khoan": "Account",
  "Tài khoản": "Account",
  "Dang nhap": "Sign in",
  "Dang xuat": "Sign out",
  "Dat ngay": "Book now",
  "Dat lich": "Book",
  "Đặt lịch": "Book",
  "Dat lich ngay": "Book now",
  "Đặt ngay": "Book now",
  "Chi tiet": "Details",
  "Xem chi tiet": "View details",
  "Xem chi tiết": "View details",
  "Xem chi tiet ve chung toi": "Learn more about us",
  "Xem chi tiết về chúng tôi": "Learn more about us",
  "Tiep tuc dat lich": "Continue booking",
  "Chon ngay va khung gio": "Choose date and time",
  "Thong tin hanh khach": "Passenger details",
  "Hoan tat form booking": "Complete booking form",
  "Ho va ten": "Full name",
  "So dien thoai": "Phone",
  "So nguoi lon": "Adults",
  "So tre em": "Children",
  "Ghi chu": "Notes",
  "Khong co ghi chu": "No notes",
  "Phuong thuc thanh toan": "Payment method",
  "Di chuyen den diem bay": "Getting to the flight site",
  "Di chuyen": "Transport",
  "Tu den diem hen": "Self-arrival",
  "Tu den": "Self-arrival",
  "Xe den don": "Pickup service",
  "Xe don": "Pickup",
  "Dia chi don": "Pickup address",
  "Can tra truoc": "Amount due now",
  "Tong gia tri": "Total value",
  "Tong gia tri tour": "Total tour value",
  "Gia tri tour": "Tour value",
  "Xac nhan dat lich": "Confirm booking",
  "Thanh toan va xac nhan booking": "Payment and booking confirmation",
  "Mo cong thanh toan": "Open payment gateway",
  "Kiem tra trang thai thanh toan": "Check payment status",
  "Theo doi hanh trinh bay": "Track flight journey",
  "Ban do hanh trinh": "Journey map",
  "Ban do se hien thi khi hanh trinh bat dau.": "The map appears when the journey starts.",
  "Dieu kien bay": "Flight condition",
  "Điều kiện bay": "Flight condition",
  "Thoi tiet": "Weather",
  "Thời tiết": "Weather",
  "Ly tuong": "Ideal",
  "Khong ly tuong": "Not ideal",
  "Nhiet do": "Temperature",
  "Nhiệt độ": "Temperature",
  "Suc gio": "Wind",
  "Sức gió": "Wind",
  "Chi so UV": "UV index",
  "Chỉ số UV": "UV index",
  "Tam nhin": "Visibility",
  "Tầm nhìn": "Visibility",
  "Diem cat canh": "Launch site",
  "Diem ha canh": "Landing site",
  "Tre em toi thieu": "Minimum child age",
  "Gia dich vu": "Service price",
  "Chuan bi truoc bay": "Before flying",
  "Checklist danh cho khach hang": "Customer checklist",
  "Dich vu di kem": "Included services",
  "Nhung gi da co trong goi": "Included in this package",
  "Dieu kien tham gia": "Participation rules",
  "Bai viet moi": "Latest posts",
  "Xem tat ca bai viet": "View all posts",
  "Xem goi dich vu": "View services",
  "Xem tat ca": "View all",
  "Gia tu": "From",
  "Giá từ": "From",
  "Da Nang Paragliding": "Da Nang Paragliding",
  "Da Nang": "Da Nang",
  "Đà Nẵng Paragliding": "Da Nang Paragliding",
  "ĐÀ NẴNG": "DA NANG",
  "Đóng": "Close",
  "Lien ket": "Links",
  "Liên kết": "Links",
  "Trải nghiệm cảm giác tự do bay lượn trên bầu trời Đà Nẵng, ngắm nhìn vẻ đẹp của bán đảo Sơn Trà từ trên cao.":
    "Experience the freedom of flying above Da Nang and see Son Tra Peninsula from the sky.",
  "Bán đảo Sơn Trà, Đà Nẵng": "Son Tra Peninsula, Da Nang",
  "Khám phá vẻ đẹp tuyệt mỹ của bán đảo Sơn Trà từ góc nhìn của loài chim. An toàn, chuyên nghiệp và đầy cảm xúc.":
    "Discover the beauty of Son Tra Peninsula from a bird's-eye view. Safe, professional, and unforgettable.",
  "Về chúng tôi": "About us",
  "CHINH PHỤC BẦU TRỜI ĐÀ NẴNG": "CONQUER THE DA NANG SKY",
  "Chúng tôi là đơn vị hàng đầu cung cấp dịch vụ bay dù lượn đôi tại Đà Nẵng. Với sứ mệnh mang đến trải nghiệm bay an toàn và đầy cảm xúc, chúng tôi đã đồng hành cùng hàng ngàn du khách chinh phục bầu trời Sơn Trà.":
    "We are a leading tandem paragliding operator in Da Nang. With a mission to deliver safe, memorable flights, we have helped thousands of guests explore the Son Tra sky.",
  "Phi công chuyên nghiệp": "Professional pilots",
  "Đội ngũ phi công có hàng ngàn giờ bay.": "Pilots with thousands of flight hours.",
  "Miễn phí trung chuyển": "Free transfer",
  "Xe đưa đón tận nơi từ điểm tập kết.": "Pickup from the meeting point.",
  "Lưu giữ khoảnh khắc": "Capture the moment",
  "Quay video GoPro 4K và Flycam.": "4K GoPro and drone footage.",
  "Đảm bảo an toàn": "Safety assured",
  "Trang thiết bị hiện đại, bảo hiểm 100tr.": "Modern equipment and 100M VND coverage.",
  "Gói Tour Nổi Bật": "Featured Packages",
  "Khám phá các lựa chọn bay dù lượn hàng đầu tại Đà Nẵng, được thiết kế để mang lại trải nghiệm tốt nhất.":
    "Explore top paragliding options in Da Nang, designed for the best experience.",
  "Xem tất cả các gói": "View all packages",
  "Trải nghiệm thực tế": "Real experience",
  "Hành trình chinh phục đỉnh Sơn Trà": "Journey to conquer Son Tra Peak",
  "Tin Tức Mới Nhất": "Latest News",
  "Tin Tức & Hoạt Động": "News & Activities",
  "Cập nhật những thông tin, kinh nghiệm và câu chuyện thú vị về dù lượn.":
    "Updates, tips, and stories about paragliding.",
  "Cập nhật những thông tin mới nhất về hoạt động nhảy dù lượn tại Đà Nẵng.":
    "Get the latest paragliding updates in Da Nang.",
  "Dịch Vụ Bay Dù Lượn": "Paragliding Services",
  "Khám phá các gói tour đa dạng, phù hợp với mọi nhu cầu và ngân sách của bạn.":
    "Explore packages for different needs and budgets.",
  "Các Gói Tour Có Sẵn": "Available Packages",
  "Chọn trải nghiệm dù lượn hoàn hảo cho chuyến phiêu lưu của bạn":
    "Choose the right paragliding experience for your trip",
  "Liên Hệ": "Contact",
  "Bạn có thắc mắc hoặc muốn đặt lịch bay? Hãy liên hệ với chúng tôi qua các kênh dưới đây.":
    "Have a question or want to book a flight? Contact us through the channels below.",
  "Liên Hệ Với Chúng Tôi": "Contact Us",
  "Bạn có thắc mắc hoặc muốn đặt lịch bay? Hãy liên hệ với chúng tôi qua các kênh dưới đây hoặc để lại lời nhắn.":
    "Have a question or want to book a flight? Contact us through the channels below or leave a message.",
  "Địa chỉ": "Address",
  "Thời tiết hôm nay": "Today's Weather",
  "Dự báo thời tiết": "Weather Forecast",
  "Trống": "Available",
  "Đã đầy": "Full",
  "Trung bình": "Medium",
  "Chua co du lieu weather": "No weather data yet",
  "He thong dang cho du lieu forecast cho thang nay.": "The system is waiting for this month's forecast data.",
  "Ban van co the xem danh sach goi bay va quay lai sau de chon lich phu hop.":
    "You can still view packages and come back later to choose a suitable time.",
  "Tam thoi chua mo ban": "Not available yet",
  "Hien tai chua co goi dich vu active de hien thi.": "There are no active packages to show yet.",
  "Hay lien he": "Please contact",
  "de duoc tu van lich bay phu hop.": "for help choosing a suitable flight time.",
  "Blog dang duoc cap nhat.": "The blog is being updated.",
  "Khi admin dang bai moi, user va pilot se thay noi dung tai day.":
    "New posts from admin will appear here for customers and pilots.",
  "Doc bai viet": "Read post",
  "Hinh anh noi bat": "Featured images",
  "Nhung khoanh khac bay, bien va Son Tra.": "Flight, sea, and Son Tra moments.",
  "Tat ca hinh anh dang duoc su dung trong website duoc gom lai mot noi de khach xem nhanh.":
    "All website images are collected here for quick browsing.",
  "Luu y": "Note",
  "Tong quan goi bay": "Package overview",
  "Trải nghiệm bay lượn tuyệt vời nhất tại Đà Nẵng.": "The best paragliding experience in Da Nang.",
  "Chua chon khung gio": "No time slot selected",
  "Dang tai goi dich vu...": "Loading package...",
  "Lich da chon se duoc giu san khi sang trang dien thong tin.":
    "Your selected slot will be kept when you continue to the details form.",
  "Co the dat ngay va chon lich o buoc tiep theo.": "You can book now and choose a slot in the next step.",
  "Chua mo lich": "Schedule not open",
  "Thang nay chua co slot kha dung cho goi bay nay.": "There are no available slots for this package this month.",
  "Ban co the doi sang thang khac hoac lien he doanh nghiep de duoc ho tro.":
    "Try another month or contact the business for support.",
  "Van hanh trong ngay bay": "Flight-day operation",
  "Khach se duoc brief an toan truoc gio bay va xac nhan suc khoe tai diem tap ket.":
    "Guests receive a safety briefing and health check at the meeting point before flying.",
  "Anh va video se duoc doi ngu media ho tro ban giao sau chuyen bay theo goi dich vu.":
    "The media team helps deliver photos and videos after the flight according to the package.",
  "Lich bay thuc te co the duoc dieu chinh nhe neu weather thay doi sat gio cat canh.":
    "The actual schedule may shift slightly if weather changes near launch time.",
  "Mac trang phuc gon gang, giay the thao va tranh mang vat dung de roi.":
    "Wear neat clothing, sports shoes, and avoid loose items.",
  "Den diem tap ket som 20 den 30 phut de brief an toan va can doi thiet bi.":
    "Arrive 20 to 30 minutes early for the safety briefing and equipment fitting.",
  "Thong bao truoc neu ban co tien su say xe, benh tien dinh hoac van de tim mach.":
    "Tell us in advance if you have motion sickness, vestibular issues, or heart conditions.",
  "Thieu thong tin dat lich": "Missing booking information",
  "Hay chon mot goi dich vu truoc khi dat lich.": "Please choose a package before booking.",
  "Quay lai danh sach dich vu": "Back to service list",
  "Bat buoc dang nhap": "Sign-in required",
  "Dang nhap de tiep tuc dat lich": "Sign in to continue booking",
  "He thong se tu dong dien email, so dien thoai va luu lich su booking vao tai khoan cua ban.":
    "The system will fill your email and phone and save booking history to your account.",
  "Dang nhap ngay": "Sign in now",
  "Khach co the doi ngay, khung gio va xem weather theo gio ngay tren man hinh dat lich.":
    "Guests can change the date, time slot, and view hourly weather on the booking screen.",
  "Chon lai lich neu can": "Choose another slot if needed",
  "Lich bay va weather theo gio": "Flight schedule and hourly weather",
  "O trong co the dat. O X da het pilot hoac bi khoa do dieu kien bay.":
    "Open cells can be booked. X cells are full or locked because of flight conditions.",
  "Booking rule": "Booking rule",
  "Hay chon mot o con trong tren lich truoc khi dien form dat lich.":
    "Choose an available slot on the calendar before filling the booking form.",
  "Thong tin thoi tiet theo gio se hien ngay ben duoi lich khi hover vao tung slot.":
    "Hourly weather appears below the calendar when you hover over each slot.",
  "Booking summary": "Booking summary",
  "Tóm tắt booking": "Booking summary",
  "Service": "Service",
  "Ngay bay": "Flight date",
  "Ngày bay": "Flight date",
  "Khung gio": "Time slot",
  "Khung giờ": "Time slot",
  "Dịch vụ đi kèm": "Included services",
  "Tổng quan": "Overview",
  "Tổng quan gói bay": "Package overview",
  "Các gói tour có sẵn": "Available packages",
  "Tin tức & Hoạt động": "News & Activities",
  "Đọc bài viết": "Read post",
  "Xem tất cả bài viết": "View all posts",
  "Chưa có dữ liệu thời tiết": "No weather data yet",
  "Đang cập nhật": "Updating",
  "Tien tra truoc gom": "The upfront payment includes",
  "gia tri tour va phi xe don neu khach chon xe den don.":
    "of the tour value plus pickup fee if pickup is selected.",
  "Khach tu di chuyen den khu vuc Chua Buu Dai Son.": "Guests travel to the Chua Buu Dai Son area themselves.",
  "Cong them 50.000 VND vao tien tra truoc.": "Add 50,000 VND to the upfront payment.",
  "Nhap dia chi don tai Da Nang": "Enter pickup address in Da Nang",
  "Nhap dia chi don.": "Enter pickup address.",
  "QR vi dien tu": "E-wallet QR",
  "Thanh toan dat coc online bang QR.": "Pay the deposit online by QR.",
  "QR cong thanh toan": "Payment gateway QR",
  "Checkout online va nhan booking confirm ngay sau khi tra coc.":
    "Check out online and receive booking confirmation after the deposit is paid.",
  "QR chuyen khoan": "Bank transfer QR",
  "Hien thi QR va noi dung chuyen khoan theo ma booking.":
    "Show QR and transfer content by booking code.",
  "Toi dong y dieu khoan bay, dieu kien suc khoe va chinh sach hoan huy booking cua doanh nghiep.":
    "I agree to the flight terms, health requirements, and cancellation policy.",
  "Thong tin lien he duoc lay tu tai khoan. Neu can chinh sua, hay cap nhat trong trang tai khoan.":
    "Contact information comes from your account. Update it in your account page if needed.",
  "Dang gui booking...": "Submitting booking...",
  "Dat lich thanh cong.": "Booking created successfully.",
  "Dang chuyen sang buoc thanh toan dat coc...": "Moving to the deposit payment step...",
  "Chua co booking": "No booking yet",
  "Hay tao booking truoc khi vao trang thanh toan.": "Create a booking before opening the payment page.",
  "Chon goi dich vu": "Choose a package",
  "Sau khi thanh toan thanh cong, booking se chuyen sang confirmed va customer co the vao tracking page de xem hanh trinh.":
    "After payment succeeds, the booking moves to confirmed and the customer can open the tracking page.",
  "Huong dan thanh toan": "Payment guide",
  "Dat coc bang QR": "QR deposit",
  "Thanh toan so tien tra truoc qua cong thanh toan. Sau khi nha cung cap tra ve trang thai PAID, booking se duoc confirm va email xac nhan se duoc gui cho khach.":
    "Pay the upfront amount through the payment gateway. Once the provider returns PAID, the booking is confirmed and a confirmation email is sent.",
  "So tien dat coc": "Deposit amount",
  "Noi dung chuyen khoan": "Transfer content",
  "Het han luc": "Expires at",
  "Giao dich": "Transaction",
  "Da thanh toan": "Paid",
  "QR da het han": "QR expired",
  "Dang xu ly...": "Processing...",
  "He thong chua nhan duoc trang thai PAID tu cong thanh toan. Hay kiem tra lai sau khi thanh toan xong.":
    "The system has not received PAID status from the gateway yet. Check again after payment.",
  "Quan ly thong tin ca nhan va lich su booking": "Manage personal information and booking history",
  "Customer co the cap nhat thong tin lien he de booking sau duoc dien nhanh va chinh xac hon.":
    "Customers can update contact details so future bookings are filled faster and more accurately.",
  "Ho so ca nhan": "Personal profile",
  "Ngon ngu": "Language",
  "Tieng Viet": "Vietnamese",
  "Da luu thong tin thanh cong.": "Information saved successfully.",
  "Dang luu...": "Saving...",
  "Luu thong tin": "Save information",
  "Lich su booking": "Booking history",
  "Chua co booking nao trong tai khoan nay.": "There are no bookings in this account yet.",
  "Hay chon mot goi dich vu va dat lich de bat dau luu lich su booking.":
    "Choose a package and book a slot to start saving booking history.",
  "Xem chi tiet booking": "View booking details",
  "Ghi chu ho tro": "Support note",
  "Chi tiet booking": "Booking details",
  "Quay lai tai khoan": "Back to account",
  "Da huy": "Cancelled",
  "Trang thai": "Status",
  "Thoi gian tao booking": "Booking created at",
  "Pilot phu trach": "Assigned pilot",
  "Huy booking": "Cancel booking",
  "Ly do huy": "Cancellation reason",
  "Khong co ly do": "No reason provided",
  "Dang tai booking hoac booking khong ton tai trong tai khoan nay.":
    "Loading booking, or this booking does not exist in this account.",
  "Huy truoc ngay bay 5 ngay: hoan 100% tien coc. Huy sau moc 5 ngay: khong hoan coc.":
    "Cancel at least 5 days before flight date for a 100% deposit refund. After that, the deposit is non-refundable.",
  "Dong": "Close",
  "Dang huy...": "Cancelling...",
  "Nhap ly do huy booking": "Enter cancellation reason",
  "Ngan hang": "Bank",
  "So tai khoan": "Account number",
  "Chu tai khoan": "Account holder",
  "Dang nhap bang email": "Sign in with email",
  "Nhap email, Da Nang Paragliding se gui link xac thuc. Khong can mat khau va khong can dang ky rieng.":
    "Enter your email and Da Nang Paragliding will send a verification link. No password or separate registration needed.",
  "Email la bat buoc.": "Email is required.",
  "Email khong hop le.": "Invalid email.",
  "Link xac thuc da duoc gui. Neu ban mo link tren dien thoai, man hinh nay se tu dong vao tai khoan sau khi email duoc xac thuc.":
    "The verification link has been sent. If you open the link on your phone, this screen will enter your account after verification.",
  "Email da duoc xac thuc. Dang chuyen vao tai khoan...":
    "Email verified. Redirecting to your account...",
  "Dang gui link...": "Sending link...",
  "Gui link xac thuc": "Send verification link",
  "Link xac thuc khong hop le": "Invalid verification link",
  "Email da duoc xac thuc": "Email verified",
  "Khong the xac thuc email": "Could not verify email",
  "Dang xac thuc email": "Verifying email",
  "Token xac thuc bi thieu. Hay mo dung link moi nhat trong email Da Nang Paragliding.":
    "Verification token is missing. Open the latest link from the Da Nang Paragliding email.",
  "Tai khoan cua ban da san sang. He thong se chuyen ve trang chu trong giay lat.":
    "Your account is ready. The system will return to the home page shortly.",
  "Link xac thuc da het han.": "The verification link has expired.",
  "Vui long doi trong khi chung toi kich hoat tai khoan cua ban.":
    "Please wait while we activate your account.",
  "Ve trang chu": "Back to home",
  "Gui lai link xac thuc": "Send verification link again",
  "Theo doi hanh trinh": "Track journey",
  "Theo doi booking va vi tri GPS.": "Track booking and GPS location.",
  "Khach da dang nhap se thay hanh trinh gan nhat ngay lap tuc.":
    "Signed-in customers can immediately see their latest journey.",
  "Tra cuu tracking": "Tracking lookup",
  "Email hoac so dien thoai": "Email or phone",
  "Dang tra cuu...": "Looking up...",
  "Tra cuu booking": "Look up booking",
  "Email khach": "Customer email",
  "Lien he doanh nghiep": "Contact business",
  "Thong tin booking": "Booking information",
  "Phe duyet": "Approval",
  "Thanh toan": "Payment",
  "Pilot": "Pilot",
  "Timeline": "Timeline",
  "Ban do GPS": "GPS map",
  "Hien tai booking van dang cho xac nhan hoac cho toi gio khoi hanh.":
    "This booking is still waiting for confirmation or departure time.",
  "Tracking ready": "Tracking ready",
  "Nhap thong tin booking de hien thi timeline va vi tri GPS.":
    "Enter booking information to show timeline and GPS location.",
  "Ngay sau khi customer dat lich thanh cong, booking co the duoc tra cuu lai tu trang nay.":
    "After a customer books successfully, the booking can be looked up from this page.",
  "Doanh nghiep du luon van hanh theo huong service-first va safety-first.":
    "The paragliding business operates with a service-first and safety-first mindset.",
  "Customer side duoc ket noi truc tiep voi booking, tracking va quy trinh van hanh thuc te cua doi ngu.":
    "The customer side is connected directly to booking, tracking, and the team's real operating process.",
  "Cau chuyen doanh nghiep": "Business story",
  "Chung toi tap trung vao booking minh bach, lich ro rang va trai nghiem an toan.":
    "We focus on transparent booking, clear scheduling, and safe experiences.",
  "Toan bo flow duoc thiet ke de user co the xem lich trong, dat lich, thanh toan va theo doi hanh trinh ma khong can phai cho qua nhieu thao tac thu cong.":
    "The full flow lets users view availability, book, pay, and track their journey without waiting through manual steps.",
  "Operational highlight": "Operational highlight",
  "Doi ngu huong dan vien": "Guide team",
  "Nhung nguoi truc tiep van hanh chuyen bay": "The people operating each flight",
  "Chung nhan an toan": "Safety certification",
  "He thong checklist va thong tin dong bo": "Checklist system and synchronized information",
  "Pilot doi da duoc huan luyen va van hanh bay doi thuong mai.":
    "Tandem pilots are trained and operate commercial tandem flights.",
  "Dieu phoi vien theo doi weather, slot va luu luong booking theo ngay.":
    "Coordinators monitor weather, slots, and daily booking flow.",
  "Nhan su media ho tro giao anh va video sau chuyen bay.":
    "Media staff help deliver photos and videos after the flight.",
  "Checklist thiet bi truoc cat canh va sau ha canh.": "Equipment checklist before takeoff and after landing.",
  "Briefing an toan, can nang va dieu kien suc khoe duoc xac nhan truoc gio bay.":
    "Safety briefing, weight, and health conditions are confirmed before flight time.",
  "Thong tin route, weather va trang thai chuyen bay duoc cap nhat de khach theo doi lai de dang.":
    "Route, weather, and flight status are updated so guests can follow up easily.",
  "Quy trinh checklist, chon gio bay va pilot assignment duoc thuc hien truoc moi booking.":
    "Checklist, flight-time selection, and pilot assignment are handled before each booking.",
  "Khach, admin va pilot deu theo mot luong thong tin thong nhat tren he thong.":
    "Customers, admins, and pilots follow one shared information flow.",
  "Hinh anh va video chuyen bay la mot phan cua trai nghiem, khong phai phan phu.":
    "Flight photos and videos are part of the experience, not an add-on.",
  "Pilot co chung chi va duoc admin gan theo booking da xac nhan.":
    "Certified pilots are assigned by admin after booking confirmation.",
  "Nhan su dieu phoi cap nhat slot full, weather va flight status theo ngay.":
    "Coordinators update full slots, weather, and flight status daily.",
  "Khach nhan ma booking ro rang, email xac nhan va kenh lien he truc tiep.":
    "Guests receive a clear booking code, confirmation email, and direct contact channel.",
  "Cap nhat dung so dien thoai de doanh nghiep lien he nhanh khi can doi lich.":
    "Keep your phone number updated so the business can contact you quickly if the schedule changes.",
  "Moi booking se luu ma code, trang thai thanh toan va tinh trang chuyen bay.":
    "Each booking stores its code, payment status, and flight status.",
  "Neu can ho tro gap, khach co the goi truc tiep trong khung gio support.":
    "For urgent support, customers can call during support hours.",
  "Khong the dat vao ngay day hoac slot da full.": "You cannot book a full day or a full slot.",
  "So tre em phai phu hop do tuoi toi thieu cua goi bay.":
    "Children must meet the package minimum age.",
  "Sau khi gui booking, slot se duoc giu theo logic thanh toan cua he thong.":
    "After booking submission, the slot is held according to the system payment logic.",
  "Booking online se hien thi QR va noi dung chuyen khoan theo ma booking.":
    "Online booking shows the QR and transfer content by booking code.",
  "Thanh toan thanh cong se chuyen booking sang confirmed.": "Successful payment moves the booking to confirmed.",
  "Neu QR het han, khach can tao lai yeu cau thanh toan moi.":
    "If the QR expires, the customer needs to create a new payment request.",
  "Nhap dung email hoac so dien thoai da dung khi dat lich de lay lai booking.":
    "Enter the email or phone used for booking to retrieve it.",
  "Tracking timeline hien cac moc dang cho, dang di chuyen, dang bay va da ha canh.":
    "The tracking timeline shows waiting, moving, flying, and landed milestones.",
  "Neu khong tim thay booking, hay lien he doanh nghiep de kiem tra thong tin xac thuc.":
    "If no booking is found, contact the business to verify the information.",
  "Cho xac nhan": "Waiting for confirmation",
  "Dang cho": "Waiting",
  "Dang di chuyen den diem don": "Heading to pickup point",
  "Dang di chuyen den diem bay": "Heading to launch site",
  "Dang bay": "Flying",
  "Da ha canh": "Landed",
  "Cho duyet": "Pending approval",
  "Da xac nhan": "Confirmed",
  "Cho thanh toan": "Awaiting payment",
  "Cho thanh toan online": "Awaiting online payment",
  "Thanh toan that bai": "Payment failed",
  "Da het han thanh toan": "Payment expired",
  "Chua co du lieu kha dung cho thang nay.": "No availability data for this month.",
  "Chua co du lieu thoi tiet thuc te tu API cho lich bay nay.":
    "No real weather data from the API for this flight schedule.",
  "Chua co goi active": "No active package",
  "Danh sach dich vu dang duoc cap nhat.": "The service list is being updated.",
  "Khach van co the lien he hotline de dat lich thu cong trong khi doi he thong mo lich.":
    "Guests can call the hotline to book manually while waiting for online scheduling.",
  "Chua Buu Dai Son": "Chua Buu Dai Son",
  "Dinh Ban Co": "Ban Co Peak",
  "Bai bien truoc Chua Buu Dai Son": "Beach in front of Chua Buu Dai Son",
  "Diem hien tai": "Current location",
  "Bay đôi buổi sáng với điều phối thời tiết và media cơ bản.": "A morning tandem flight with weather coordination and basic media.",
  "Bay doi buoi sang voi dieu phoi thoi tiet va media co ban.": "A morning tandem flight with weather coordination and basic media.",
  "Gói bay phù hợp cho người mới, tập trung vào trải nghiệm cất cánh nhẹ nhàng, khung giờ sáng và đội ngũ hỗ trợ đầy đủ từ briefing tới hạ cánh.": "A beginner-friendly package focused on a gentle launch, morning schedule, and full support from briefing to landing.",
  "Goi bay phu hop cho nguoi moi, tap trung vao trai nghiem cat canh nhe nhang, khung gio sang va doi ngu ho tro day du tu briefing toi ha canh.": "A beginner-friendly package focused on a gentle launch, morning schedule, and full support from briefing to landing.",
  "Gói bay hoàng hôn với thời lượng dài hơn và bộ ảnh video đầy đủ.": "A longer golden-hour flight with a complete photo and video set.",
  "Goi bay hoang hon voi thoi luong dai hon va bo anh video day du.": "A longer golden-hour flight with a complete photo and video set.",
  "Thiết kế cho khách muốn có trải nghiệm thị giác mạnh, ánh sáng đẹp và nội dung truyền thông trọn gói với tổ media đồng hành.": "Designed for guests who want dramatic views, beautiful light, and a full media set from the support team.",
  "Thiet ke cho khach muon co trai nghiem thi giac manh, anh sang dep va noi dung truyen thong tron goi voi to media dong hanh.": "Designed for guests who want dramatic views, beautiful light, and a full media set from the support team.",
  "Gói cho nhóm nhỏ kèm điều phối lịch liên tiếp và hỗ trợ doanh nghiệp.": "A small-group package with consecutive-slot coordination and business support.",
  "Goi cho nhom nho kem dieu phoi lich lien tiep va ho tro doanh nghiep.": "A small-group package with consecutive-slot coordination and business support.",
  "Phù hợp hoạt động team building với nhiều booking liên tiếp, ưu tiên điều phối khung giờ và hỗ trợ liên hệ nhóm trưởng.": "Suitable for team-building groups with consecutive bookings, priority slot coordination, and group-lead support.",
  "Phu hop hoat dong team building voi nhieu booking lien tiep, uu tien dieu phoi khung gio va ho tro lien he nhom truong.": "Suitable for team-building groups with consecutive bookings, priority slot coordination, and group-lead support.",
  "Phi công bay đôi": "Tandem pilot",
  "Phi cong bay doi": "Tandem pilot",
  "Bảo hiểm cơ bản": "Basic insurance",
  "Bao hiem co ban": "Basic insurance",
  "Ảnh hậu trường": "Behind-the-scenes photos",
  "Anh hau truong": "Behind-the-scenes photos",
  "Mũ bảo hộ": "Safety helmet",
  "Mu bao ho": "Safety helmet",
  "Video dựng ngắn": "Short edited video",
  "Video dung ngan": "Short edited video",
  "Xe trung chuyển lên điểm bay": "Transfer to the launch site",
  "Xe trung chuyen len diem bay": "Transfer to the launch site",
  "Điều phối nhóm": "Group coordination",
  "Dieu phoi nhom": "Group coordination",
  "Ảnh nhóm": "Group photos",
  "Anh nhom": "Group photos",
  "Nước uống": "Drinking water",
  "Nuoc uong": "Drinking water",
  "Tuân thủ briefing an toàn": "Follow the safety briefing",
  "Tuan thu briefing an toan": "Follow the safety briefing",
  "Không có bệnh lý chống chỉ định nghiêm trọng": "No serious contraindicated medical conditions",
  "Khong co benh ly chong chi dinh nghiem trong": "No serious contraindicated medical conditions",
  "Đến trước giờ bay 30 phút": "Arrive 30 minutes before flight time",
  "Den truoc gio bay 30 phut": "Arrive 30 minutes before flight time",
  "Mặc đồ gọn, giày bám tốt": "Wear neat clothing and shoes with good grip",
  "Mac do gon, giay bam tot": "Wear neat clothing and shoes with good grip",
  "Đăng ký danh sách trước 24h": "Register the participant list 24 hours in advance",
  "Dang ky danh sach truoc 24h": "Register the participant list 24 hours in advance",
  "Giữ liên lạc với điều phối viên": "Stay in contact with the coordinator",
  "Giu lien lac voi dieu phoi vien": "Stay in contact with the coordinator",
  "Điểm cất cánh Sơn Trà": "Son Tra launch site",
  "Diem cat canh Son Tra": "Son Tra launch site",
  "Bãi đáp Sơn Trà": "Son Tra landing beach",
  "Bai dap Son Tra": "Son Tra landing beach",
  "Bãi đáp Hoàng Sa": "Hoang Sa landing beach",
  "Bai dap Hoang Sa": "Hoang Sa landing beach",
  "Điểm cất cánh Hòn Sụp": "Hon Sup launch site",
  "Diem cat canh Hon Sup": "Hon Sup launch site",
  "Bãi đáp Mân Thái": "Man Thai landing beach",
  "Bai dap Man Thai": "Man Thai landing beach",
  "Checklist ngắn gọn cho lần bay đầu: sức khỏe, trang phục, giờ tập trung và cách đến điểm bay.": "A short checklist for your first flight: health, clothing, meeting time, and getting to the launch site.",
  "Checklist ngan gon cho lan bay dau: suc khoe, trang phuc, gio tap trung va cach den diem bay.": "A short checklist for your first flight: health, clothing, meeting time, and getting to the launch site.",
  "Lần bay đầu tiên nên được chuẩn bị theo 4 nhóm việc: trang phục gọn, giày bám tốt, đến điểm hẹn đúng giờ và giữ tinh thần thoải mái. Người bay đôi sẽ briefing kỹ trước cất cánh, vì vậy khách chỉ cần làm đúng hướng dẫn và báo sớm nếu có tiền sử sức khỏe cần lưu ý.": "Your first flight should be prepared around four things: neat clothing, grippy shoes, arriving on time, and staying relaxed. The tandem pilot will brief you before launch, so follow the instructions and tell the team early about any relevant health history.",
  "Giải thích vì sao lịch booking cần đi kèm snapshot thời tiết và cách đọc nhanh gió, UV, điều kiện bay.": "Why the booking calendar includes weather snapshots, and how to read wind, UV, and flight conditions quickly.",
  "Giai thich vi sao lich booking can di kem snapshot thoi tiet va cach doc nhanh gio, UV, dieu kien bay.": "Why the booking calendar includes weather snapshots, and how to read wind, UV, and flight conditions quickly.",
  "Tốc độ gió và mức UV là hai chỉ số khách nhìn thấy ngay trên booking calendar. Nếu gió tốt và UV ở mức chấp nhận được, điều kiện bay sẽ ổn định hơn. Admin và điều phối viên vẫn là người quyết định cuối cùng, nhưng snapshot này giúp khách chọn khung giờ hợp lý hơn.": "Wind speed and UV are the two indicators guests see directly on the booking calendar. Good wind and acceptable UV usually mean more stable conditions. Admins and coordinators still make the final call, but the snapshot helps guests choose better time slots.",
  "Một ngày vận hành gói gọn admin, pilot và tracking phối hợp như thế nào.": "How admin, pilot, and tracking work together during an operations day.",
  "Mot ngay van hanh goi gon admin, pilot va tracking phoi hop nhu the nao.": "How admin, pilot, and tracking work together during an operations day.",
  "Sau khi booking được xác nhận, admin gán pilot, pilot cập nhật mốc vận hành, và khách theo dõi route trên bản đồ. Đây là luồng 3 role cần có để vận hành dù lượn minh bạch và tránh gọi điện quá nhiều lần cho cùng một thông tin.": "After a booking is confirmed, admin assigns a pilot, the pilot updates each operational milestone, and the guest follows the route on the map. This three-role flow keeps paragliding operations transparent and avoids repeated calls for the same information."
};

const originalTextNodes = new WeakMap<Node, string>();
const originalAttributes = new WeakMap<Element, Record<string, string>>();

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const translationPairs = Object.entries(phraseTranslations)
  .flatMap(([source, target]) => {
    const normalizedSource = normalizeText(source);
    return normalizedSource === source
      ? [[source, target] as const]
      : [
          [source, target] as const,
          [normalizedSource, target] as const
        ];
  })
  .sort((left, right) => right[0].length - left[0].length);

const exactTranslations = new Map(translationPairs);

const dynamicTranslations: Array<[RegExp, (...matches: string[]) => string]> = [
  [
    /Dat lich thanh cong\. Ma booking ([^.]+)\. Dang chuyen sang buoc thanh toan dat coc\.\.\./i,
    (_match, code) => `Booking created successfully. Booking code ${code}. Moving to the deposit payment step...`
  ],
  [
    /Đặt lịch thành công\. Mã booking ([^.]+)\. Đang chuyển sang bước thanh toán đặt cọc\.\.\./i,
    (_match, code) => `Booking created successfully. Booking code ${code}. Moving to the deposit payment step...`
  ],
  [
    /Dự báo\s*(.*?)\s*Ngày\s*(\d+\/\d+)/i,
    (_match, slot, date) => `Forecast ${slot ? `${slot.trim()} - ` : ""}${date}`
  ],
  [
    /Du bao\s*(.*?)\s*Ngay\s*(\d+\/\d+)/i,
    (_match, slot, date) => `Forecast ${slot ? `${slot.trim()} - ` : ""}${date}`
  ],
  [/Tre em tu (\d+) tuoi tro len\./i, (_match, age) => `Children from ${age} years old and up.`],
  [/Trẻ em từ (\d+) tuổi trở lên\./i, (_match, age) => `Children from ${age} years old and up.`],
  [/(\d+)\+\s*tuoi/i, (_match, age) => `${age}+ years old`],
  [/(\d+)\s*phut/i, (_match, minutes) => `${minutes} minutes`],
  [/Ma booking:\s*([^\n]+)/i, (_match, code) => `Booking code: ${code.trim()}`],
  [/Code:\s*([^\n]+)/i, (_match, code) => `Code: ${code.trim()}`],
  [/Phe duyet:\s*([^\n]+)/i, (_match, status) => `Approval: ${translateText(status.trim())}`],
  [/Thanh toan:\s*([^\n]+)/i, (_match, status) => `Payment: ${translateText(status.trim())}`],
  [/Lich bay:\s*([^l]+)\sluc\s*([^\n]+)/i, (_match, date, time) => `Flight: ${date.trim()} at ${time.trim()}`],
  [/Pilot:\s*([^\n]+)/i, (_match, pilot) => `Pilot: ${translateText(pilot.trim())}`],
  [/Tam nhin:\s*([^\n]+)/i, (_match, value) => `Visibility: ${value.trim()}`],
  [/Điều kiện bay:\s*([^\n]+)/i, (_match, value) => `Flight condition: ${translateText(value.trim())}`],
  [/Dieu kien bay:\s*([^\n]+)/i, (_match, value) => `Flight condition: ${translateText(value.trim())}`],
  [/Huy booking\s*([A-Za-z0-9-]*)/i, (_match, code) => `Cancel booking${code ? ` ${code}` : ""}`]
];

function translateText(value: string): string {
  const compact = normalizeText(value);
  if (!compact) {
    return value;
  }

  const exact = exactTranslations.get(value.trim()) ?? exactTranslations.get(compact);
  if (exact) {
    return value.replace(value.trim(), exact);
  }

  let translated = value;
  translationPairs.forEach(([source, target]) => {
    if (source.length < 4) {
      return;
    }

    translated = translated.replace(new RegExp(escapeRegExp(source), "gi"), target);
  });

  dynamicTranslations.forEach(([pattern, replacer]) => {
    translated = translated.replace(pattern, (...matches) => replacer(...(matches as string[])));
  });

  return translated;
}

const translateDocument = (locale: Locale) => {
  if (typeof document === "undefined") {
    return;
  }

  const shouldSkip = (node: Node) => {
    const parent = node.parentElement;
    return Boolean(parent?.closest("script,style,textarea,code,pre,[data-no-translate]"));
  };

  const translateTextNode = (node: Node) => {
    if (shouldSkip(node)) {
      return;
    }

    const current = node.textContent ?? "";
    const storedOriginal = originalTextNodes.get(node);
    if (locale === "vi") {
      if (!storedOriginal) {
        return;
      }

      const expectedTranslation = translateText(storedOriginal);
      if (current === expectedTranslation) {
        node.textContent = storedOriginal;
      }
      originalTextNodes.delete(node);
      return;
    }

    if (!current.trim()) {
      return;
    }

    const sourceText = storedOriginal && current === translateText(storedOriginal) ? storedOriginal : current;
    const nextText = translateText(sourceText);
    if (nextText !== sourceText) {
      originalTextNodes.set(node, sourceText);
      if (current !== nextText) {
        node.textContent = nextText;
      }
    }
  };

  const translateAttributes = (element: Element) => {
    const attrs = ["placeholder", "title", "aria-label", "alt"];
    const stored = originalAttributes.get(element) ?? {};
    attrs.forEach((attr) => {
      const value = element.getAttribute(attr);
      if (!value) {
        return;
      }

      if (locale === "vi") {
        if (stored[attr]) {
          element.setAttribute(attr, stored[attr]);
          delete stored[attr];
        }
        return;
      }

      const sourceValue = stored[attr] && value === translateText(stored[attr]) ? stored[attr] : value;
      const translated = translateText(sourceValue);
      if (translated !== sourceValue) {
        stored[attr] = sourceValue;
        if (value !== translated) {
          element.setAttribute(attr, translated);
        }
      }
    });

    if (Object.keys(stored).length) {
      originalAttributes.set(element, stored);
    } else {
      originalAttributes.delete(element);
    }
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateTextNode(node);
    node = walker.nextNode();
  }
  document.querySelectorAll("[placeholder],[title],[aria-label],img[alt]").forEach(translateAttributes);
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (value: Locale) => void;
  t: (key: keyof (typeof dictionaries)["vi"]) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: PropsWithChildren) => {
  const [locale, setLocaleState] = useState<Locale>(() => (languageStorage.get() === "en" ? "en" : "vi"));

  useEffect(() => {
    document.documentElement.lang = locale;
    let translateTimer: number | null = null;
    const scheduleTranslate = () => {
      if (translateTimer) {
        window.clearTimeout(translateTimer);
      }
      translateTimer = window.setTimeout(() => translateDocument(locale), 0);
    };

    scheduleTranslate();
    const observer = new MutationObserver(scheduleTranslate);
    observer.observe(document.body, {
      attributeFilter: ["placeholder", "title", "aria-label", "alt"],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true
    });

    return () => {
      if (translateTimer) {
        window.clearTimeout(translateTimer);
      }
      observer.disconnect();
    };
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale(nextLocale) {
        languageStorage.set(nextLocale);
        setLocaleState(nextLocale);
      },
      t(key) {
        return dictionaries[locale][key];
      }
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
};
