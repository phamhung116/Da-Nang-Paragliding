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
    create_service_package_use_case,
    list_posts_use_case,
    get_monthly_availability_use_case,
    list_service_packages_use_case,
    review_booking_use_case,
    update_post_use_case,
    update_service_package_use_case,
    update_flight_status_use_case,
)
from modules.accounts.application.dto import AccountPayload
from modules.bookings.application.dto import AssignPilotRequest, BookingCreateRequest, ReviewBookingRequest
from modules.bookings.infrastructure.persistence.mongo.documents import BookingDocument
from modules.catalog.application.dto import ServicePackagePayload
from modules.posts.application.dto import PostPayload
from modules.tracking.infrastructure.persistence.mongo.documents import FlightTrackingDocument


class Command(BaseCommand):
    help = "Seed demo data for local development and UI preview."

    def handle(self, *args, **options):
        self._sync_accounts()
        service_map = {service.slug: service for service in list_service_packages_use_case().execute(active_only=False)}
        for payload in self._service_payloads():
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

    def _service_payloads(self) -> list[ServicePackagePayload]:
        return [
            ServicePackagePayload(
                slug="son-tra-sunrise-flight",
                name="Sunrise Discovery Flight",
                short_description="Bay doi buoi sang voi dieu phoi thoi tiet va media co ban.",
                description="Goi bay phu hop cho nguoi moi, tap trung vao trai nghiem cat canh nhe nhang, khung gio sang va doi ngu ho tro day du tu briefing toi ha canh.",
                price=Decimal("1490000"),
                flight_duration_minutes=18,
                included_services=["Phi cong bay doi", "Bao hiem co ban", "Anh hau truong", "Mu bao ho"],
                participation_requirements=["Tuan thu briefing an toan", "Khong co benh ly chong chi dinh nghiem trong"],
                min_child_age=7,
                hero_image="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
                ],
                launch_site_name="Diem cat canh Son Tra",
                launch_lat=16.1202,
                launch_lng=108.2894,
                landing_site_name="Bai dap Son Tra",
                landing_lat=16.0941,
                landing_lng=108.2475,
                featured=True,
                active=True,
            ),
            ServicePackagePayload(
                slug="golden-hour-signature-flight",
                name="Golden Hour Signature Flight",
                short_description="Goi bay hoang hon voi thoi luong dai hon va bo anh video day du.",
                description="Thiet ke cho khach muon co trai nghiem thi giac manh, anh sang dep va noi dung truyen thong tron goi voi to media dong hanh.",
                price=Decimal("2190000"),
                flight_duration_minutes=28,
                included_services=["Phi cong bay doi", "GoPro highlight", "Video dung ngan", "Xe trung chuyen len diem bay"],
                participation_requirements=["Den truoc gio bay 30 phut", "Mac do gon, giay bam tot"],
                min_child_age=10,
                hero_image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80",
                ],
                launch_site_name="Dinh Ban Co",
                launch_lat=16.1372,
                launch_lng=108.281,
                landing_site_name="Bai dap Hoang Sa",
                landing_lat=16.1107,
                landing_lng=108.2554,
                featured=True,
                active=True,
            ),
            ServicePackagePayload(
                slug="team-bonding-cloud-run",
                name="Team Bonding Cloud Run",
                short_description="Goi cho nhom nho kem dieu phoi lich lien tiep va ho tro doanh nghiep.",
                description="Phu hop hoat dong team building voi nhieu booking lien tiep, uu tien dieu phoi khung gio va ho tro lien he nhom truong.",
                price=Decimal("1790000"),
                flight_duration_minutes=22,
                included_services=["Phi cong bay doi", "Dieu phoi nhom", "Anh nhom", "Nuoc uong"],
                participation_requirements=["Dang ky danh sach truoc 24h", "Giu lien lac voi dieu phoi vien"],
                min_child_age=12,
                hero_image="https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=1200&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
                ],
                launch_site_name="Diem cat canh Hon Sup",
                launch_lat=16.1116,
                launch_lng=108.2947,
                landing_site_name="Bai dap Man Thai",
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
                title="How to prepare for your first tandem flight",
                excerpt="Checklist ngan gon cho lan bay dau: suc khoe, trang phuc, gio tap trung va cach den diem bay.",
                content=(
                    "Lan bay dau tien nen duoc chuan bi theo 4 nhom viec: trang phuc gon, giay bam tot, "
                    "den diem hen dung gio va giu tinh than thoai mai. Nguoi bay doi se briefing ky truoc "
                    "cat canh, vi vay user chi can lam dung huong dan va bao som neu co tien su suc khoe can luu y."
                ),
                cover_image="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                published=True,
            ),
            PostPayload(
                slug="why-wind-and-uv-matter-before-booking",
                title="Why wind and UV matter before booking a flight slot",
                excerpt="Giai thich vi sao lich booking can di kem snapshot thoi tiet va cach doc nhanh gio, UV, dieu kien bay.",
                content=(
                    "Toc do gio va muc UV la hai chi so user nhin thay ngay tren booking calendar. "
                    "Neu gio tot va UV o muc chap nhan duoc, dieu kien bay se on dinh hon. "
                    "Admin va dieu phoi vien van la nguoi quyet dinh cuoi cung, nhung snapshot nay giup user chon khung gio hop ly hon."
                ),
                cover_image="https://images.unsplash.com/photo-1544625344-63189df1e401?auto=format&fit=crop&w=1200&q=80",
                published=True,
            ),
            PostPayload(
                slug="behind-the-scenes-of-a-live-flight-ops-day",
                title="Behind the scenes of a live flight operations day",
                excerpt="Mot ngay van hanh goi gon admin, pilot va tracking phoi hop nhu the nao.",
                content=(
                    "Sau khi booking duoc xac nhan, admin gan pilot, pilot cap nhat moc van hanh, "
                    "va user theo doi route tren ban do. Day la luong 3 role can co de van hanh du luon "
                    "minh bach va tranh goi dien qua nhieu lan cho cung mot thong tin."
                ),
                cover_image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
                published=True,
            ),
        ]

    def _account_payloads(self) -> list[dict[str, str]]:
        return [
            {
                "full_name": "SkyNest Admin",
                "email": "admin@skynest.vn",
                "phone": "+84909000001",
                "password": "Admin12345!",
                "role": "ADMIN",
                "preferred_language": "vi",
            },
            {
                "full_name": "Nguyen Minh Anh",
                "email": "customer@skynest.vn",
                "phone": "+84909000111",
                "password": "Customer123!",
                "role": "CUSTOMER",
                "preferred_language": "vi",
            },
            {
                "full_name": "Pilot Son Tra 01",
                "email": "pilot01@skynest.vn",
                "phone": "+84908000111",
                "password": "Pilot12345!",
                "role": "PILOT",
                "preferred_language": "vi",
            },
            {
                "full_name": "Pilot Son Tra 02",
                "email": "pilot02@skynest.vn",
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
