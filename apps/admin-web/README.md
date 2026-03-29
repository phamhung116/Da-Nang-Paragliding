# Admin Web Guide

Admin app là React app riêng cho quản trị viên và nhân sự vận hành.

## Mục tiêu

- Không trộn route, auth guard, layout và state của admin vào customer app.
- Dễ scale sang permission theo vai trò như `super_admin`, `operator`, `support`.

## Luồng ưu tiên build trước

1. Booking requests
2. Confirm/reject booking
3. Booking list/calendar
4. Update flight status
5. Manage service packages
