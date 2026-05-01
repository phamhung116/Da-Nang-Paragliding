from __future__ import annotations

from decimal import Decimal
from html import escape

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail

from modules.bookings.domain.entities import Booking
from modules.notifications.infrastructure.persistence.mongo.repositories import (
    MongoNotificationLogRepository,
)


class ConsoleNotificationGateway:
    def __init__(self, *, provider_name: str, log_repository: MongoNotificationLogRepository) -> None:
        self.provider_name = provider_name
        self.log_repository = log_repository

    def send_booking_update(self, booking: Booking, message: str) -> None:
        self.log_repository.create(
            channel=self.provider_name,
            recipient=booking.email or booking.phone,
            title=f"Cập nhật lịch đặt {booking.code}",
            message=message,
        )
        if booking.email:
            send_mail(
                subject=f"Cập nhật lịch đặt Dù lượn Đà Nẵng {booking.code}",
                message=(
                    f"Xin chào {booking.customer_name},\n\n"
                    f"{message}\n\n"
                    f"Mã đặt lịch: {booking.code}\n"
                    f"Lịch bay: {booking.flight_date} lúc {booking.flight_time}\n\n"
                    "Dù lượn Đà Nẵng"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.email],
                fail_silently=False,
            )
        print(f"[notification:{self.provider_name}] lich_dat={booking.code} nguoi_nhan={booking.email or booking.phone}")

    def send_booking_confirmation(self, booking: Booking) -> None:
        if not booking.email:
            return

        subject = f"Xác nhận đặt lịch Dù lượn Đà Nẵng {booking.code}"
        self.log_repository.create(
            channel=self.provider_name,
            recipient=booking.email,
            title=subject,
            message=f"Lịch đặt {booking.code} đã thanh toán cọc và được xác nhận.",
        )

        text_body = self._build_confirmation_text_body(booking)
        html_body = self._build_confirmation_html_body(booking)
        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[booking.email],
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=False)
        print(f"[notification:{self.provider_name}] xac_nhan_lich_dat={booking.code} nguoi_nhan={booking.email}")

    def _build_confirmation_text_body(self, booking: Booking) -> str:
        return (
            f"Xin chào {booking.customer_name},\n\n"
            "Dù lượn Đà Nẵng đã ghi nhận thanh toán cọc và xác nhận lịch đặt của bạn.\n\n"
            f"Mã đặt lịch: {booking.code}\n"
            f"Dịch vụ: {booking.service_name}\n"
            f"Lịch bay: {booking.flight_date} lúc {booking.flight_time}\n"
            f"Số khách: {self._guest_label(booking)}\n"
            f"Điểm hẹn/điểm đón: {self._pickup_label(booking)}\n"
            f"Phi công: {booking.assigned_pilot_name or 'Sẽ cập nhật sau'}\n"
            f"Tổng giá trị: {self._format_money(booking.final_total)}\n"
            f"Đã thanh toán cọc: {self._format_money(booking.deposit_amount)}\n\n"
            "Bạn có thể theo dõi lịch đặt và GPS tại:\n"
            f"{self._tracking_url()}\n\n"
            "Vui lòng có mặt đúng giờ, mang giày thể thao hoặc sandal có quai, và theo dõi điện thoại "
            "để nhận cập nhật từ phi công.\n\n"
            f"Hotline: {settings.BUSINESS_INFO['phone']}\n"
            "Dù lượn Đà Nẵng"
        )

    def _build_confirmation_html_body(self, booking: Booking) -> str:
        business = settings.BUSINESS_INFO
        rows = [
            ("Mã đặt lịch", booking.code),
            ("Dịch vụ", booking.service_name),
            ("Lịch bay", f"{booking.flight_date} lúc {booking.flight_time}"),
            ("Số khách", self._guest_label(booking)),
            ("Điểm hẹn/điểm đón", self._pickup_label(booking)),
            ("Phi công", booking.assigned_pilot_name or "Sẽ cập nhật sau"),
            ("Tổng giá trị", self._format_money(booking.final_total)),
            ("Đã thanh toán cọc", self._format_money(booking.deposit_amount)),
            ("Trạng thái", "Đã thanh toán cọc và xác nhận lịch đặt"),
        ]
        detail_rows = "\n".join(
            f"""
                <tr>
                  <td style="padding:12px 0;color:#806f76;font-size:13px;border-bottom:1px solid #f3d9df;">{escape(label)}</td>
                  <td style="padding:12px 0;color:#25171c;font-size:14px;font-weight:800;text-align:right;border-bottom:1px solid #f3d9df;">{escape(str(value))}</td>
                </tr>
            """
            for label, value in rows
        )
        full_name = escape(booking.customer_name)
        tracking_url = escape(self._tracking_url(), quote=True)
        business_name = escape(str(business["name"]))
        business_phone = escape(str(business["phone"]))
        business_email = escape(str(business["email"]))
        business_address = escape(str(business["address"]))

        return f"""
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Xác nhận đặt lịch Dù lượn Đà Nẵng</title>
  </head>
  <body style="margin:0;background:#fff7f9;color:#25171c;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7f9;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #f2d6de;border-radius:28px;overflow:hidden;box-shadow:0 18px 46px rgba(110,26,48,.12);">
            <tr>
              <td style="padding:30px 28px 22px;background:linear-gradient(135deg,#c91842 0%,#8f102b 100%);color:#ffffff;">
                <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.16);font-size:12px;font-weight:900;letter-spacing:.14em;">ĐÃ XÁC NHẬN</div>
                <h1 style="margin:20px 0 8px;font-size:34px;line-height:1.08;letter-spacing:-.04em;">Lịch đặt của bạn đã được xác nhận</h1>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#ffe7ed;">Dù lượn Đà Nẵng đã ghi nhận thanh toán cọc cho lịch đặt {escape(booking.code)}.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 8px;">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">Xin chào <strong>{full_name}</strong>,</p>
                <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#6f6267;">Dưới đây là thông tin chuyến bay của bạn. Vui lòng kiểm tra lại lịch bay, điểm đón và thông tin liên hệ.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  {detail_rows}
                </table>
                <a href="{tracking_url}" style="display:inline-block;margin-top:24px;padding:15px 24px;border-radius:999px;background:#c91842;color:#ffffff;text-decoration:none;font-weight:800;box-shadow:0 14px 28px rgba(201,24,66,.22);">Theo dõi lịch đặt</a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 30px;">
                <div style="padding:16px 18px;border-radius:20px;background:#fff5f7;border:1px solid #f2d6de;color:#6f6267;font-size:14px;line-height:1.7;">
                  Vui lòng có mặt đúng giờ, mang giày thể thao hoặc sandal có quai, và theo dõi điện thoại để nhận cập nhật từ phi công.
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #f2d6de;margin-top:20px;padding-top:18px;">
                  <tr>
                    <td style="font-size:13px;line-height:1.7;color:#8b7b82;">
                      <strong style="color:#25171c;">{business_name}</strong><br />
                      {business_phone} | {business_email}<br />
                      {business_address}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""

    def _pickup_label(self, booking: Booking) -> str:
        if booking.pickup_option == "pickup":
            return booking.pickup_address or "Địa chỉ đón sẽ được cập nhật"
        return booking.launch_site_name or "Khách tự đến điểm hẹn"

    def _guest_label(self, booking: Booking) -> str:
        parts = []
        if booking.adults:
            parts.append(f"{booking.adults} người lớn")
        if booking.children:
            parts.append(f"{booking.children} trẻ em")
        return ", ".join(parts) or "1 khách"

    def _tracking_url(self) -> str:
        return f"{settings.CUSTOMER_WEB_URL.rstrip('/')}/tracking"

    def _format_money(self, amount: Decimal) -> str:
        return f"{int(amount):,}".replace(",", ".") + " VND"
