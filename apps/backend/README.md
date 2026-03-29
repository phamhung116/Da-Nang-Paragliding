# Backend Guide

## Stack đề xuất

- Django
- Django REST Framework
- MongoDB
- MongoDB Django Backend hoặc adapter MongoDB chính thức cho Django
- Celery/Redis cho notification, payment webhook, tracking event nếu cần async

## Cấu trúc backend

```text
apps/backend
|-- src/
|   |-- config/
|   |-- shared/
|   `-- modules/
|       |-- catalog/
|       |-- bookings/
|       |-- availability/
|       |-- payments/
|       |-- tracking/
|       |-- notifications/
|       `-- users/
`-- tests/
```

## Nguyên tắc

- `domain` không phụ thuộc framework.
- `application` chứa use case, orchestration và interface.
- `infrastructure` implement repository/gateway cụ thể.
- `presentation` chỉ nhận request và trả response.

## Ví dụ use case đầu tiên nên làm

- `catalog`: list service packages, service detail
- `availability`: get monthly calendar, weather snapshot for date
- `bookings`: create booking request, lookup by phone
