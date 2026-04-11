from __future__ import annotations

from html import escape

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from modules.accounts.application.interfaces import VerificationEmailContext


class CustomerEmailGateway:
    def send_verification_email(self, context: VerificationEmailContext) -> None:
        subject = "Xac thuc email dat lich Da Nang Paragliding"
        text_body = self._build_text_body(context)
        html_body = self._build_html_body(context)

        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[context.account.email],
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=False)

    def _build_text_body(self, context: VerificationEmailContext) -> str:
        return (
            f"Xin chao {context.account.full_name},\n\n"
            "Vui long mo link duoi day de xac thuc email va dang nhap Da Nang Paragliding:\n\n"
            f"{context.verification_url}\n\n"
            f"Link co hieu luc trong {context.expires_hours} gio. Neu ban khong tao tai khoan, "
            "co the bo qua email nay."
        )

    def _build_html_body(self, context: VerificationEmailContext) -> str:
        business = settings.BUSINESS_INFO
        full_name = escape(context.account.full_name)
        verification_url = escape(context.verification_url, quote=True)
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
    <title>Xac thuc email Da Nang Paragliding</title>
  </head>
  <body style="margin:0;background:#fff7f9;color:#25171c;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7f9;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #f2d6de;border-radius:28px;overflow:hidden;box-shadow:0 18px 46px rgba(110,26,48,.12);">
            <tr>
              <td style="padding:28px 28px 18px;background:linear-gradient(135deg,#c91842 0%,#8f102b 100%);color:#ffffff;">
                <div style="display:inline-block;width:52px;height:52px;line-height:52px;text-align:center;border-radius:16px;background:rgba(255,255,255,.16);font-weight:900;letter-spacing:.08em;">DP</div>
                <h1 style="margin:22px 0 8px;font-size:34px;line-height:1.08;letter-spacing:-.04em;">Xac thuc email cua ban</h1>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#ffe7ed;">Hoan tat buoc bao mat de bat dau dat lich bay du luon tai Da Nang.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 10px;">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">Xin chao <strong>{full_name}</strong>,</p>
                <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#6f6267;">Vui long bam nut ben duoi de xac thuc email, dang nhap, dat lich va theo doi hanh trinh bay.</p>
                <a href="{verification_url}" style="display:inline-block;padding:15px 24px;border-radius:999px;background:#c91842;color:#ffffff;text-decoration:none;font-weight:800;box-shadow:0 14px 28px rgba(201,24,66,.22);">Xac thuc email</a>
                <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#8b7b82;">Link nay co hieu luc trong <strong>{context.expires_hours} gio</strong>. Neu nut khong hoat dong, hay copy link sau vao trinh duyet:</p>
                <p style="margin:10px 0 0;padding:12px 14px;border-radius:14px;background:#fff5f7;border:1px solid #f2d6de;font-size:13px;line-height:1.6;word-break:break-all;color:#8f102b;">{verification_url}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 30px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #f2d6de;padding-top:18px;">
                  <tr>
                    <td style="font-size:13px;line-height:1.7;color:#8b7b82;">
                      <strong style="color:#25171c;">{business_name}</strong><br />
                      {business_phone} | {business_email}<br />
                      {business_address}
                    </td>
                  </tr>
                </table>
                <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#9b8d93;">Neu ban khong tao tai khoan Da Nang Paragliding, vui long bo qua email nay.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""
