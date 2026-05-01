from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from config.containers import (
    account_repository,
    assign_pilot_use_case,
    complete_online_payment_use_case,
    create_booking_use_case,
    create_post_use_case,
    create_service_feature_use_case,
    create_service_package_use_case,
    list_service_features_use_case,
    list_posts_use_case,
    get_monthly_availability_use_case,
    list_service_packages_use_case,
    review_booking_use_case,
    update_post_use_case,
    update_service_feature_use_case,
    update_service_package_use_case,
    update_flight_status_use_case,
)
from modules.accounts.application.dto import AccountPayload
from modules.bookings.application.dto import AssignPilotRequest, BookingCreateRequest, ReviewBookingRequest
from modules.bookings.infrastructure.persistence.mongo.documents import BookingDocument
from modules.catalog.application.dto import ServiceFeaturePayload, ServicePackagePayload
from modules.posts.application.dto import PostPayload
from modules.tracking.infrastructure.persistence.mongo.documents import FlightTrackingDocument


class Command(BaseCommand):
    help = "Tạo dữ liệu mẫu cho môi trường phát triển và xem trước giao diện."

    def handle(self, *args, **options):
        self._sync_accounts()
        existing_feature_map = {feature.name: feature for feature in list_service_features_use_case().execute(active_only=False)}
        for payload in self._feature_payloads():
            if payload.name in existing_feature_map:
                update_service_feature_use_case().execute(existing_feature_map[payload.name].id or "", payload)
            else:
                create_service_feature_use_case().execute(payload)
        feature_map = {feature.name: feature for feature in list_service_features_use_case().execute(active_only=False)}
        self.stdout.write(self.style.SUCCESS("Đã đồng bộ dịch vụ đi kèm."))

        service_map = {service.slug: service for service in list_service_packages_use_case().execute(active_only=False)}
        for payload in self._service_payloads(feature_map):
            if payload.slug in service_map:
                update_service_package_use_case().execute(payload.slug, payload)
            else:
                create_service_package_use_case().execute(payload)
        services = list_service_packages_use_case().execute(active_only=False)
        self.stdout.write(self.style.SUCCESS("Đã đồng bộ danh mục dịch vụ."))

        post_map = {post.slug: post for post in list_posts_use_case().execute(published_only=False)}
        for payload in self._post_payloads():
            if payload.slug in post_map:
                update_post_use_case().execute(payload.slug, payload)
            else:
                create_post_use_case().execute(payload)
        self.stdout.write(self.style.SUCCESS("Đã đồng bộ bài viết."))

        today = date.today()
        for service in services:
            for offset in (0, 1):
                seed_date = today + timedelta(days=30 * offset)
                get_monthly_availability_use_case().execute(
                    service.slug,
                    seed_date.year,
                    seed_date.month,
                )

        primary_service = services[0]
        secondary_service = services[1] if len(services) > 1 else services[0]
        existing_phones = set(BookingDocument.objects.values_list("phone", flat=True))

        if "+84909000111" not in existing_phones:
            pending_slot = self._first_open_slot(
                get_monthly_availability_use_case().execute(
                    primary_service.slug,
                    today.year,
                    today.month,
                ),
                min_date=today + timedelta(days=2),
            )
            create_booking_use_case().execute(
                BookingCreateRequest(
                    service_slug=primary_service.slug,
                    flight_date=pending_slot["date"],
                    flight_time=pending_slot["time"],
                    customer_name="Nguyễn Minh Anh",
                    phone="+84909000111",
                    email="dangcho@example.com",
                    adults=2,
                    children=0,
                    notes="Muốn giữ lịch bay buổi sáng.",
                    payment_method="cash",
                )
            )

        if "+84909000222" not in existing_phones:
            confirmed_slot = self._first_open_slot(
                get_monthly_availability_use_case().execute(
                    secondary_service.slug,
                    today.year,
                    today.month,
                ),
                min_date=today + timedelta(days=3),
            )
            confirmed_result = create_booking_use_case().execute(
                BookingCreateRequest(
                    service_slug=secondary_service.slug,
                    flight_date=confirmed_slot["date"],
                    flight_time=confirmed_slot["time"],
                    customer_name="Trần Hoàng Khang",
                    phone="+84909000222",
                    email="xacnhan@example.com",
                    adults=2,
                    children=1,
                    notes="Đặt lịch cho nhóm gia đình.",
                    payment_method="cash",
                )
            )
            review_booking_use_case().execute(
                confirmed_result["booking"].code,
                ReviewBookingRequest(
                    decision="confirm",
                    pilot_name="Phi công Sơn Trà 01",
                    pilot_phone="+84908000111",
                ),
            )

        if "+84909000333" not in existing_phones:
            online_slot = self._first_open_slot(
                get_monthly_availability_use_case().execute(
                    primary_service.slug,
                    today.year,
                    today.month,
                ),
                min_date=today + timedelta(days=4),
            )
            online_result = create_booking_use_case().execute(
                BookingCreateRequest(
                    service_slug=primary_service.slug,
                    flight_date=online_slot["date"],
                    flight_time=online_slot["time"],
                    customer_name="Lê Bảo Châu",
                    phone="+84909000333",
                    email="tructuyen@example.com",
                    adults=1,
                    children=0,
                    notes="Muốn lộ trình có góc quay đẹp.",
                    payment_method="gateway",
                )
            )
            complete_online_payment_use_case().execute(online_result["booking"].code)
            assign_pilot_use_case().execute(
                online_result["booking"].code,
                AssignPilotRequest(pilot_name="Phi công Sơn Trà 02", pilot_phone="+84908000222"),
            )
            update_flight_status_use_case().execute(online_result["booking"].code, "EN_ROUTE")
            update_flight_status_use_case().execute(online_result["booking"].code, "FLYING")

        self._repair_snapshot_texts(services)
        self.stdout.write(self.style.SUCCESS("Đã tạo dữ liệu mẫu."))

    def _sync_accounts(self) -> None:
        repository = account_repository()
        for payload in self._account_payloads():
            existing = repository.get_by_email(payload["email"])
            if existing:
                existing.full_name = payload["full_name"]
                existing.phone = payload["phone"]
                existing.role = payload["role"]
                existing.preferred_language = payload["preferred_language"]
                existing.is_active = True
                repository.update(existing, password_hash=make_password(payload["password"]))
            else:
                repository.create(
                    AccountPayload(
                        full_name=payload["full_name"],
                        email=payload["email"],
                        phone=payload["phone"],
                        role=payload["role"],
                        preferred_language=payload["preferred_language"],
                        is_active=True,
                        email_verified=True,
                    ),
                    password_hash=make_password(payload["password"]),
                )
        self.stdout.write(self.style.SUCCESS("Đã đồng bộ tài khoản."))

    def _first_open_slot(self, days, *, min_date: date):
        for day in days:
            if day.date < min_date:
                continue
            for slot in day.slots:
                if not slot.is_locked and not slot.is_full:
                    return {"date": day.date, "time": slot.time}
        raise RuntimeError("Không tìm thấy khung giờ trống để tạo dữ liệu mẫu.")

    def _feature_payloads(self) -> list[ServiceFeaturePayload]:
        return [
            ServiceFeaturePayload(
                name="Phi công bay đôi",
                name_en="Phi công bay đôi",
                description="Phi công bay đôi đã được phân công theo lịch đặt.",
                description_en="Phi công bay đôi đã được phân công theo lịch đặt.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Bảo hiểm cơ bản",
                name_en="Bảo hiểm cơ bản",
                description="Bảo hiểm cơ bản cho trải nghiệm bay.",
                description_en="Bảo hiểm cơ bản cho trải nghiệm bay.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Ảnh hậu trường",
                name_en="Ảnh hậu trường",
                description="Một số ảnh ghi lại khoảnh khắc chuẩn bị trước chuyến bay.",
                description_en="Một số ảnh ghi lại khoảnh khắc chuẩn bị trước chuyến bay.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Mũ bảo hộ",
                name_en="Mũ bảo hộ",
                description="Trang bị bảo hộ tiêu chuẩn trước khi cất cánh.",
                description_en="Trang bị bảo hộ tiêu chuẩn trước khi cất cánh.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Điểm nhấn GoPro",
                name_en="Điểm nhấn GoPro",
                description="Ghi lại các khoảnh khắc nổi bật trong chuyến bay.",
                description_en="Ghi lại các khoảnh khắc nổi bật trong chuyến bay bằng GoPro.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Video dựng ngắn",
                name_en="Video dựng ngắn",
                description="Video ngắn đã dựng để khách dễ lưu giữ và chia sẻ.",
                description_en="Video ngắn đã dựng để khách dễ lưu giữ và chia sẻ.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Xe trung chuyển lên điểm bay",
                name_en="Xe trung chuyển lên điểm bay",
                description="Hỗ trợ di chuyển lên điểm cất cánh theo gói.",
                description_en="Hỗ trợ di chuyển lên điểm cất cánh theo gói đã chọn.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Điều phối nhóm",
                name_en="Điều phối nhóm",
                description="Điều phối nhiều khách trong cùng nhóm theo khung giờ liên tiếp.",
                description_en="Điều phối nhiều khách trong cùng nhóm theo các khung giờ liên tiếp.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Ảnh nhóm",
                name_en="Ảnh nhóm",
                description="Ảnh lưu niệm cho nhóm trước hoặc sau chuyến bay.",
                description_en="Ảnh lưu niệm cho nhóm trước hoặc sau chuyến bay.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Nước uống",
                name_en="Nước uống",
                description="Nước uống hỗ trợ khách trong quá trình tập kết.",
                description_en="Nước uống hỗ trợ khách trong quá trình tập kết.",
                active=True,
            ),
        ]

    def _service_payloads(self, feature_map: dict[str, object]) -> list[ServicePackagePayload]:
        return [
            ServicePackagePayload(
                slug="son-tra-sunrise-flight",
                name="Chuyến bay bình minh Sơn Trà",
                name_en="Chuyến bay bình minh Sơn Trà",
                short_description="Bay đôi buổi sáng với điều phối thời tiết và bộ ảnh cơ bản.",
                short_description_en="Bay đôi buổi sáng với điều phối thời tiết và bộ ảnh cơ bản.",
                description="Gói bay phù hợp cho người mới, tập trung vào trải nghiệm cất cánh nhẹ nhàng, khung giờ sáng và đội ngũ hỗ trợ đầy đủ từ hướng dẫn an toàn tới hạ cánh.",
                description_en="Gói bay phù hợp cho người mới, tập trung vào trải nghiệm cất cánh nhẹ nhàng, khung giờ sáng và đội ngũ hỗ trợ đầy đủ từ hướng dẫn an toàn tới hạ cánh.",
                price=Decimal("1490000"),
                flight_duration_minutes=18,
                included_feature_ids=[
                    feature_map["Phi công bay đôi"].id or "",
                    feature_map["Bảo hiểm cơ bản"].id or "",
                    feature_map["Ảnh hậu trường"].id or "",
                    feature_map["Mũ bảo hộ"].id or "",
                ],
                participation_requirements=["Tuân thủ hướng dẫn an toàn", "Không có bệnh lý chống chỉ định nghiêm trọng"],
                min_child_age=7,
                hero_image="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
                ],
                launch_site_name="Điểm cất cánh Sơn Trà",
                launch_lat=16.1202,
                launch_lng=108.2894,
                landing_site_name="Bãi đáp Sơn Trà",
                landing_lat=16.0941,
                landing_lng=108.2475,
                featured=True,
                active=True,
            ),
            ServicePackagePayload(
                slug="golden-hour-signature-flight",
                name="Chuyến bay hoàng hôn đặc biệt",
                name_en="Chuyến bay hoàng hôn đặc biệt",
                short_description="Gói bay hoàng hôn với thời lượng dài hơn và bộ ảnh video đầy đủ.",
                short_description_en="Gói bay hoàng hôn với thời lượng dài hơn và bộ ảnh video đầy đủ.",
                description="Thiết kế cho khách muốn có trải nghiệm thị giác mạnh, ánh sáng đẹp và nội dung truyền thông trọn gói với tổ quay dựng đồng hành.",
                description_en="Thiết kế cho khách muốn có trải nghiệm thị giác mạnh, ánh sáng đẹp và nội dung truyền thông trọn gói với tổ quay dựng đồng hành.",
                price=Decimal("2190000"),
                flight_duration_minutes=28,
                included_feature_ids=[
                    feature_map["Phi công bay đôi"].id or "",
                    feature_map["Điểm nhấn GoPro"].id or "",
                    feature_map["Video dựng ngắn"].id or "",
                    feature_map["Xe trung chuyển lên điểm bay"].id or "",
                ],
                participation_requirements=["Đến trước giờ bay 30 phút", "Mặc đồ gọn, giày bám tốt"],
                min_child_age=10,
                hero_image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80",
                ],
                launch_site_name="Đỉnh Bàn Cờ",
                launch_lat=16.1372,
                launch_lng=108.281,
                landing_site_name="Bãi đáp Hoàng Sa",
                landing_lat=16.1107,
                landing_lng=108.2554,
                featured=True,
                active=True,
            ),
            ServicePackagePayload(
                slug="team-bonding-cloud-run",
                name="Chuyến bay nhóm gắn kết",
                name_en="Chuyến bay nhóm gắn kết",
                short_description="Gói cho nhóm nhỏ kèm điều phối lịch liên tiếp và hỗ trợ doanh nghiệp.",
                short_description_en="Gói cho nhóm nhỏ kèm điều phối lịch liên tiếp và hỗ trợ doanh nghiệp.",
                description="Phù hợp hoạt động gắn kết đội nhóm với nhiều lịch đặt liên tiếp, ưu tiên điều phối khung giờ và hỗ trợ liên hệ nhóm trưởng.",
                description_en="Phù hợp hoạt động gắn kết đội nhóm với nhiều lịch đặt liên tiếp, ưu tiên điều phối khung giờ và hỗ trợ liên hệ nhóm trưởng.",
                price=Decimal("1790000"),
                flight_duration_minutes=22,
                included_feature_ids=[
                    feature_map["Phi công bay đôi"].id or "",
                    feature_map["Điều phối nhóm"].id or "",
                    feature_map["Ảnh nhóm"].id or "",
                    feature_map["Nước uống"].id or "",
                ],
                participation_requirements=["Đăng ký danh sách trước 24h", "Giữ liên lạc với điều phối viên"],
                min_child_age=12,
                hero_image="https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=1200&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
                ],
                launch_site_name="Điểm cất cánh Hòn Sụp",
                launch_lat=16.1116,
                launch_lng=108.2947,
                landing_site_name="Bãi đáp Mân Thái",
                landing_lat=16.0828,
                landing_lng=108.2504,
                featured=False,
                active=True,
            ),
        ]

    def _post_payloads(self) -> list[PostPayload]:
        return [
            PostPayload(
                slug="how-to-prepare-for-your-first-flight",
                title="Chuẩn bị gì cho chuyến bay dù lượn đôi đầu tiên",
                title_en="Chuẩn bị gì cho chuyến bay dù lượn đôi đầu tiên",
                excerpt="Checklist ngắn gọn cho lần bay đầu: sức khỏe, trang phục, giờ tập trung và cách đến điểm bay.",
                excerpt_en="Checklist ngắn gọn cho lần bay đầu: sức khỏe, trang phục, giờ tập trung và cách đến điểm bay.",
                content=(
                    "Lần bay đầu tiên nên được chuẩn bị theo 4 nhóm việc: trang phục gọn, giày bám tốt, "
                    "đến điểm hẹn đúng giờ và giữ tinh thần thoải mái. Phi công bay đôi sẽ hướng dẫn kỹ trước "
                    "cất cánh, vì vậy khách chỉ cần làm đúng hướng dẫn và báo sớm nếu có tiền sử sức khỏe cần lưu ý."
                ),
                content_en=(
                    "Lần bay đầu tiên nên được chuẩn bị theo 4 nhóm việc: trang phục gọn, giày bám tốt, "
                    "đến điểm hẹn đúng giờ và giữ tinh thần thoải mái. Phi công bay đôi sẽ hướng dẫn kỹ trước "
                    "cất cánh, vì vậy khách chỉ cần làm đúng hướng dẫn và báo sớm nếu có tiền sử sức khỏe cần lưu ý."
                ),
                cover_image="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                published=True,
            ),
            PostPayload(
                slug="why-wind-and-uv-matter-before-booking",
                title="Vì sao gió và UV quan trọng trước khi đặt lịch bay",
                title_en="Vì sao gió và UV quan trọng trước khi đặt lịch bay",
                excerpt="Giải thích vì sao lịch đặt cần đi kèm ảnh chụp nhanh thời tiết và cách đọc nhanh gió, UV, điều kiện bay.",
                excerpt_en="Giải thích vì sao lịch đặt cần đi kèm ảnh chụp nhanh thời tiết và cách đọc nhanh gió, UV, điều kiện bay.",
                content=(
                    "Tốc độ gió và mức UV là hai chỉ số khách nhìn thấy ngay trên lịch đặt. "
                    "Nếu gió tốt và UV ở mức chấp nhận được, điều kiện bay sẽ ổn định hơn. "
                    "Quản trị viên và điều phối viên vẫn là người quyết định cuối cùng, nhưng ảnh chụp nhanh này giúp khách chọn khung giờ hợp lý hơn."
                ),
                content_en=(
                    "Tốc độ gió và mức UV là hai chỉ số khách nhìn thấy ngay trên lịch đặt. "
                    "Nếu gió tốt và UV ở mức chấp nhận được, điều kiện bay sẽ ổn định hơn. "
                    "Quản trị viên và điều phối viên vẫn là người quyết định cuối cùng, nhưng ảnh chụp nhanh này giúp khách chọn khung giờ hợp lý hơn."
                ),
                cover_image="https://images.unsplash.com/photo-1544625344-63189df1e401?auto=format&fit=crop&w=1200&q=80",
                published=True,
            ),
            PostPayload(
                slug="behind-the-scenes-of-a-live-flight-ops-day",
                title="Bên trong một ngày vận hành chuyến bay trực tiếp",
                title_en="Bên trong một ngày vận hành chuyến bay trực tiếp",
                excerpt="Một ngày vận hành cho thấy quản trị viên, phi công và theo dõi hành trình phối hợp như thế nào.",
                excerpt_en="Một ngày vận hành cho thấy quản trị viên, phi công và theo dõi hành trình phối hợp như thế nào.",
                content=(
                    "Sau khi lịch đặt được xác nhận, quản trị viên gán phi công, phi công cập nhật mốc vận hành, "
                    "và khách theo dõi lộ trình trên bản đồ. Đây là luồng 3 vai trò cần có để vận hành dù lượn "
                    "minh bạch và tránh gọi điện quá nhiều lần cho cùng một thông tin."
                ),
                content_en=(
                    "Sau khi lịch đặt được xác nhận, quản trị viên gán phi công, phi công cập nhật từng mốc vận hành, "
                    "và khách theo dõi lộ trình trên bản đồ. Luồng ba vai trò này giúp vận hành minh bạch "
                    "và giảm các cuộc gọi lặp lại cho cùng một trạng thái."
                ),
                cover_image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
                published=True,
            ),
        ]

    def _account_payloads(self) -> list[dict[str, str]]:
        return [
            {
                "full_name": "Quản trị Dù lượn Đà Nẵng",
                "email": "quantri@danangparagliding.vn",
                "phone": "+84909000001",
                "password": "Quantri12345!",
                "role": "ADMIN",
                "preferred_language": "vi",
            },
            {
                "full_name": "Nguyễn Minh Anh",
                "email": "khachhang@danangparagliding.vn",
                "phone": "+84909000111",
                "password": "Khachhang123!",
                "role": "CUSTOMER",
                "preferred_language": "vi",
            },
            {
                "full_name": "Phi công Sơn Trà 01",
                "email": "phicong01@danangparagliding.vn",
                "phone": "+84908000111",
                "password": "Phicong12345!",
                "role": "PILOT",
                "preferred_language": "vi",
            },
            {
                "full_name": "Phi công Sơn Trà 02",
                "email": "phicong02@danangparagliding.vn",
                "phone": "+84908000222",
                "password": "Phicong12345!",
                "role": "PILOT",
                "preferred_language": "vi",
            },
        ]

    def _repair_snapshot_texts(self, services) -> None:
        service_map = {service.slug: service for service in services}
        booking_notes = {
            "+84909000111": "Muốn giữ lịch bay buổi sáng.",
            "+84909000222": "Đặt lịch cho nhóm gia đình.",
            "+84909000333": "Muốn lộ trình có góc quay đẹp.",
        }
        booking_pilots = {
            "+84909000222": ("Phi công Sơn Trà 01", "+84908000111"),
            "+84909000333": ("Phi công Sơn Trà 02", "+84908000222"),
        }

        for booking in BookingDocument.objects.all():
            service = service_map.get(booking.service_slug)
            if service is None:
                continue
            booking.service_name = service.name
            booking.service_name_en = service.name_en or service.name
            booking.launch_site_name = service.launch_site_name
            if booking.phone in booking_notes:
                booking.notes = booking_notes[booking.phone]
            if booking.phone in booking_pilots:
                booking.assigned_pilot_name = booking_pilots[booking.phone][0]
                booking.assigned_pilot_phone = booking_pilots[booking.phone][1]
            booking.save()

        for tracking in FlightTrackingDocument.objects.all():
            booking = BookingDocument.objects.filter(code=tracking.booking_code).first()
            if booking is None:
                continue
            service = service_map.get(booking.service_slug)
            if service is None:
                continue

            timeline = list(tracking.timeline)
            for event in timeline:
                event["label"] = self._status_label(str(event.get("status", "WAITING")), service)

            route_points = list(tracking.route_points)
            for index, point in enumerate(route_points):
                status = (
                    str(timeline[index].get("status"))
                    if index < len(timeline)
                    else tracking.flight_status
                )
                point["name"] = self._location_name(status, service)

            tracking.service_name = service.name
            tracking.service_name_en = service.name_en or service.name
            tracking.pilot_name = booking.assigned_pilot_name
            tracking.current_location["name"] = self._location_name(tracking.flight_status, service)
            tracking.timeline = timeline
            tracking.route_points = route_points
            tracking.save()

    def _status_label(self, status: str, service) -> str:
        labels = {
            "WAITING": f"Đang chờ tại {service.launch_site_name}",
            "EN_ROUTE": "Đang di chuyển đến điểm bay",
            "FLYING": "Đang bay",
            "LANDED": f"Đã hạ cánh tại {service.landing_site_name}",
        }
        return labels.get(status, status)

    def _location_name(self, status: str, service) -> str:
        names = {
            "WAITING": service.launch_site_name,
            "EN_ROUTE": "Đang di chuyển đến điểm bay",
            "FLYING": "Đang bay",
            "LANDED": service.landing_site_name,
        }
        return names.get(status, service.launch_site_name)
