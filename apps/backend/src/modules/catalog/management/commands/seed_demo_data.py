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
    help = "Seed demo data for local development and UI preview."

    def handle(self, *args, **options):
        self._sync_accounts()
        existing_feature_map = {feature.name: feature for feature in list_service_features_use_case().execute(active_only=False)}
        for payload in self._feature_payloads():
            if payload.name in existing_feature_map:
                update_service_feature_use_case().execute(existing_feature_map[payload.name].id or "", payload)
            else:
                create_service_feature_use_case().execute(payload)
        feature_map = {feature.name: feature for feature in list_service_features_use_case().execute(active_only=False)}
        self.stdout.write(self.style.SUCCESS("Service features synchronized."))

        service_map = {service.slug: service for service in list_service_packages_use_case().execute(active_only=False)}
        for payload in self._service_payloads(feature_map):
            if payload.slug in service_map:
                update_service_package_use_case().execute(payload.slug, payload)
            else:
                create_service_package_use_case().execute(payload)
        services = list_service_packages_use_case().execute(active_only=False)
        self.stdout.write(self.style.SUCCESS("Catalog synchronized."))

        post_map = {post.slug: post for post in list_posts_use_case().execute(published_only=False)}
        for payload in self._post_payloads():
            if payload.slug in post_map:
                update_post_use_case().execute(payload.slug, payload)
            else:
                create_post_use_case().execute(payload)
        self.stdout.write(self.style.SUCCESS("Posts synchronized."))

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
                    customer_name="Nguyen Minh Anh",
                    phone="+84909000111",
                    email="pending@example.com",
                    adults=2,
                    children=0,
                    notes="Morning hold request.",
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
                    customer_name="Tran Hoang Khang",
                    phone="+84909000222",
                    email="confirmed@example.com",
                    adults=2,
                    children=1,
                    notes="Family group booking.",
                    payment_method="cash",
                )
            )
            review_booking_use_case().execute(
                confirmed_result["booking"].code,
                ReviewBookingRequest(
                    decision="confirm",
                    pilot_name="Pilot Son Tra 01",
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
                    customer_name="Le Bao Chau",
                    phone="+84909000333",
                    email="online@example.com",
                    adults=1,
                    children=0,
                    notes="Prefer cinematic route.",
                    payment_method="gateway",
                )
            )
            complete_online_payment_use_case().execute(online_result["booking"].code)
            assign_pilot_use_case().execute(
                online_result["booking"].code,
                AssignPilotRequest(pilot_name="Pilot Son Tra 02", pilot_phone="+84908000222"),
            )
            update_flight_status_use_case().execute(online_result["booking"].code, "EN_ROUTE")
            update_flight_status_use_case().execute(online_result["booking"].code, "FLYING")

        self._repair_snapshot_texts(services)
        self.stdout.write(self.style.SUCCESS("Demo seed completed."))

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
        self.stdout.write(self.style.SUCCESS("Accounts synchronized."))

    def _first_open_slot(self, days, *, min_date: date):
        for day in days:
            if day.date < min_date:
                continue
            for slot in day.slots:
                if not slot.is_locked and not slot.is_full:
                    return {"date": day.date, "time": slot.time}
        raise RuntimeError("No open slot found for demo seed.")

    def _feature_payloads(self) -> list[ServiceFeaturePayload]:
        return [
            ServiceFeaturePayload(
                name="Phi công bay đôi",
                name_en="Tandem pilot",
                description="Pilot tandem đã được phân công theo booking.",
                description_en="Assigned tandem pilot for the booking.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Bảo hiểm cơ bản",
                name_en="Basic insurance",
                description="Bảo hiểm cơ bản cho trải nghiệm bay.",
                description_en="Basic insurance coverage for the flight experience.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Ảnh hậu trường",
                name_en="Behind-the-scenes photos",
                description="Một số ảnh ghi lại khoảnh khắc chuẩn bị trước chuyến bay.",
                description_en="A short set of photos captured before takeoff.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Mũ bảo hộ",
                name_en="Protective helmet",
                description="Trang bị bảo hộ tiêu chuẩn trước khi cất cánh.",
                description_en="Standard protective helmet provided before launch.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="GoPro highlight",
                name_en="GoPro highlight",
                description="Ghi lại các khoảnh khắc nổi bật trong chuyến bay.",
                description_en="Highlights captured during the flight with GoPro.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Video dựng ngắn",
                name_en="Short edited video",
                description="Video ngắn đã dựng để khách dễ lưu giữ và chia sẻ.",
                description_en="A short edited video that is easy to save and share.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Xe trung chuyển lên điểm bay",
                name_en="Shuttle to launch site",
                description="Hỗ trợ di chuyển lên điểm cất cánh theo gói.",
                description_en="Transport support to the launch site based on the selected package.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Điều phối nhóm",
                name_en="Group coordination",
                description="Điều phối nhiều khách trong cùng nhóm theo khung giờ liên tiếp.",
                description_en="Coordinate multiple guests in one group across consecutive slots.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Ảnh nhóm",
                name_en="Group photos",
                description="Ảnh lưu niệm cho nhóm trước hoặc sau chuyến bay.",
                description_en="Group keepsake photos before or after the flight.",
                active=True,
            ),
            ServiceFeaturePayload(
                name="Nước uống",
                name_en="Drinking water",
                description="Nước uống hỗ trợ khách trong quá trình tập kết.",
                description_en="Drinking water for guests during check-in and staging.",
                active=True,
            ),
        ]

    def _service_payloads(self, feature_map: dict[str, object]) -> list[ServicePackagePayload]:
        return [
            ServicePackagePayload(
                slug="son-tra-sunrise-flight",
                name="Sunrise Discovery Flight",
                name_en="Sunrise Discovery Flight",
                short_description="Bay đôi buổi sáng với điều phối thời tiết và media cơ bản.",
                short_description_en="A morning tandem flight with weather coordination and a basic media set.",
                description="Gói bay phù hợp cho người mới, tập trung vào trải nghiệm cất cánh nhẹ nhàng, khung giờ sáng và đội ngũ hỗ trợ đầy đủ từ briefing tới hạ cánh.",
                description_en="A starter-friendly package focused on a smooth morning launch, gentle pacing, and full support from briefing to landing.",
                price=Decimal("1490000"),
                flight_duration_minutes=18,
                included_feature_ids=[
                    feature_map["Phi công bay đôi"].id or "",
                    feature_map["Bảo hiểm cơ bản"].id or "",
                    feature_map["Ảnh hậu trường"].id or "",
                    feature_map["Mũ bảo hộ"].id or "",
                ],
                participation_requirements=["Tuân thủ briefing an toàn", "Không có bệnh lý chống chỉ định nghiêm trọng"],
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
                name="Golden Hour Signature Flight",
                name_en="Golden Hour Signature Flight",
                short_description="Gói bay hoàng hôn với thời lượng dài hơn và bộ ảnh video đầy đủ.",
                short_description_en="A sunset package with longer airtime and a full photo and video set.",
                description="Thiết kế cho khách muốn có trải nghiệm thị giác mạnh, ánh sáng đẹp và nội dung truyền thông trọn gói với tổ media đồng hành.",
                description_en="Designed for guests who want dramatic visuals, golden light, and a complete media package accompanied by the content crew.",
                price=Decimal("2190000"),
                flight_duration_minutes=28,
                included_feature_ids=[
                    feature_map["Phi công bay đôi"].id or "",
                    feature_map["GoPro highlight"].id or "",
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
                name="Team Bonding Cloud Run",
                name_en="Team Bonding Cloud Run",
                short_description="Gói cho nhóm nhỏ kèm điều phối lịch liên tiếp và hỗ trợ doanh nghiệp.",
                short_description_en="A small-group package with back-to-back scheduling and corporate support.",
                description="Phù hợp hoạt động team building với nhiều booking liên tiếp, ưu tiên điều phối khung giờ và hỗ trợ liên hệ nhóm trưởng.",
                description_en="Built for team-building groups with consecutive bookings, slot coordination, and support for the team lead.",
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
                title="How to prepare for your first tandem paragliding flight",
                title_en="How to prepare for your first tandem paragliding flight",
                excerpt="Checklist ngắn gọn cho lần bay đầu: sức khỏe, trang phục, giờ tập trung và cách đến điểm bay.",
                excerpt_en="A quick checklist for your first flight: health, outfit, arrival time, and how to reach the launch area.",
                content=(
                    "Lần bay đầu tiên nên được chuẩn bị theo 4 nhóm việc: trang phục gọn, giày bám tốt, "
                    "đến điểm hẹn đúng giờ và giữ tinh thần thoải mái. Người bay đôi sẽ briefing kỹ trước "
                    "cất cánh, vì vậy khách chỉ cần làm đúng hướng dẫn và báo sớm nếu có tiền sử sức khỏe cần lưu ý."
                ),
                content_en=(
                    "Your first flight is best prepared around four essentials: neat clothing, good-grip shoes, "
                    "arriving on time, and staying relaxed. The tandem pilot will walk you through a full "
                    "briefing before takeoff, so guests mainly need to follow instructions and share any "
                    "important health history in advance."
                ),
                cover_image="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                published=True,
            ),
            PostPayload(
                slug="why-wind-and-uv-matter-before-booking",
                title="Why wind and UV matter before booking a flight slot",
                title_en="Why wind and UV matter before booking a flight slot",
                excerpt="Giải thích vì sao lịch booking cần đi kèm snapshot thời tiết và cách đọc nhanh gió, UV, điều kiện bay.",
                excerpt_en="Why the booking calendar needs a weather snapshot and how to read wind, UV, and flight condition at a glance.",
                content=(
                    "Tốc độ gió và mức UV là hai chỉ số khách nhìn thấy ngay trên booking calendar. "
                    "Nếu gió tốt và UV ở mức chấp nhận được, điều kiện bay sẽ ổn định hơn. "
                    "Admin và điều phối viên vẫn là người quyết định cuối cùng, nhưng snapshot này giúp khách chọn khung giờ hợp lý hơn."
                ),
                content_en=(
                    "Wind speed and UV index are the first two indicators guests see on the booking calendar. "
                    "When wind stays within a comfortable range and UV remains manageable, the flight window is "
                    "usually more stable. Admin and flight coordinators still make the final decision, but the "
                    "snapshot helps guests choose a better slot upfront."
                ),
                cover_image="https://images.unsplash.com/photo-1544625344-63189df1e401?auto=format&fit=crop&w=1200&q=80",
                published=True,
            ),
            PostPayload(
                slug="behind-the-scenes-of-a-live-flight-ops-day",
                title="Behind the scenes of a live flight operations day",
                title_en="Behind the scenes of a live flight operations day",
                excerpt="Một ngày vận hành gói gọn admin, pilot và tracking phối hợp như thế nào.",
                excerpt_en="How admin, pilot, and tracking coordinate during a full live operations day.",
                content=(
                    "Sau khi booking được xác nhận, admin gán pilot, pilot cập nhật mốc vận hành, "
                    "và khách theo dõi route trên bản đồ. Đây là luồng 3 role cần có để vận hành dù lượn "
                    "minh bạch và tránh gọi điện quá nhiều lần cho cùng một thông tin."
                ),
                content_en=(
                    "Once a booking is confirmed, admin assigns the pilot, the pilot updates each operational "
                    "milestone, and the guest can follow the route on the map. This three-role flow keeps "
                    "operations transparent and reduces repeated calls for the same status update."
                ),
                cover_image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
                published=True,
            ),
        ]

    def _account_payloads(self) -> list[dict[str, str]]:
        return [
            {
                "full_name": "Da Nang Paragliding Admin",
                "email": "admin@danangparagliding.vn",
                "phone": "+84909000001",
                "password": "Admin12345!",
                "role": "ADMIN",
                "preferred_language": "vi",
            },
            {
                "full_name": "Nguyen Minh Anh",
                "email": "customer@danangparagliding.vn",
                "phone": "+84909000111",
                "password": "Customer123!",
                "role": "CUSTOMER",
                "preferred_language": "vi",
            },
            {
                "full_name": "Pilot Son Tra 01",
                "email": "pilot01@danangparagliding.vn",
                "phone": "+84908000111",
                "password": "Pilot12345!",
                "role": "PILOT",
                "preferred_language": "vi",
            },
            {
                "full_name": "Pilot Son Tra 02",
                "email": "pilot02@danangparagliding.vn",
                "phone": "+84908000222",
                "password": "Pilot12345!",
                "role": "PILOT",
                "preferred_language": "vi",
            },
        ]

    def _repair_snapshot_texts(self, services) -> None:
        service_map = {service.slug: service for service in services}
        booking_notes = {
            "+84909000111": "Morning hold request.",
            "+84909000222": "Family group booking.",
            "+84909000333": "Prefer cinematic route.",
        }
        booking_pilots = {
            "+84909000222": ("Pilot Son Tra 01", "+84908000111"),
            "+84909000333": ("Pilot Son Tra 02", "+84908000222"),
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
            "WAITING": f"Waiting at {service.launch_site_name}",
            "EN_ROUTE": "En route to launch site",
            "FLYING": "Flying",
            "LANDED": f"Landed at {service.landing_site_name}",
        }
        return labels.get(status, status)

    def _location_name(self, status: str, service) -> str:
        names = {
            "WAITING": service.launch_site_name,
            "EN_ROUTE": "En route to launch site",
            "FLYING": "Flying",
            "LANDED": service.landing_site_name,
        }
        return names.get(status, service.launch_site_name)
