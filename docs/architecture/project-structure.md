# Project Structure

## 1. Mục tiêu của cấu trúc này

Cấu trúc repo được thiết kế để giải quyết 4 vấn đề thường gặp ở dự án booking:

1. Code backend trộn business rule với API và DB query.
2. Frontend dồn hết logic vào page/component, khó test và khó tái sử dụng.
3. Admin và customer dùng chung code bừa bãi rồi phụ thuộc lẫn nhau.
4. Hard-code trạng thái, giá, route, provider, text label và điều kiện nghiệp vụ.

Mục tiêu là để:

- thay provider thanh toán hoặc thời tiết mà không đụng vào domain;
- thêm gói dịch vụ mới hoặc thay rule booking mà không sửa lan ra toàn hệ thống;
- tách customer/admin triển khai độc lập nếu sau này cần;
- test use case mà không cần chạy full HTTP stack.

## 2. Root layout

```text
.
|-- apps/
|   |-- backend/
|   |-- customer-web/
|   |-- admin-web/
|   `-- pilot-web/
|-- packages/
|   |-- ui/
|   |-- api-client/
|   `-- config/
|-- docs/
|   |-- architecture/
|   `-- api/
|-- infra/
|   |-- docker/
|   `-- nginx/
`-- scripts/
```

## 3. Backend layout

Backend dùng Django làm delivery framework. MongoDB được đặt ở lớp infrastructure, không để business rule phụ thuộc trực tiếp document/schema.

```text
apps/backend
|-- manage.py                       # sẽ thêm khi bootstrap Django project
|-- pyproject.toml                  # sẽ thêm khi chốt dependency manager
|-- src/
|   |-- config/                     # Django settings, urls, ASGI/WSGI, celery
|   |-- shared/                     # phần dùng chung backend
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

### 3.1 Module template

Mỗi bounded context dùng cùng một template:

```text
modules/<context>/
|-- domain/
|   |-- entities/
|   |-- value_objects/
|   |-- repositories/
|   `-- services/
|-- application/
|   |-- dto/
|   |-- interfaces/
|   `-- use_cases/
|-- infrastructure/
|   |-- persistence/
|   |   `-- mongo/
|   |       |-- documents/
|   |       `-- repositories/
|   |-- gateways/
|   `-- mappers/
`-- presentation/
    `-- api/
        `-- v1/
```

### 3.2 Ý nghĩa từng lớp

#### `domain/`

Chứa nghiệp vụ thuần:

- entity: `ServicePackage`, `Booking`, `FlightSession`, `PaymentTransaction`
- value object: `Money`, `PhoneNumber`, `FlightStatus`, `BookingSlot`
- repository interface: contract đọc/ghi dữ liệu
- domain service: rule tính giá, rule kiểm tra điều kiện tham gia, rule chọn trạng thái

Không import Django model, serializer, request, response hoặc Mongo document vào đây.

#### `application/`

Chứa use case:

- tạo booking;
- xác nhận hoặc từ chối booking;
- lấy lịch availability theo tháng;
- tạo payment session;
- cập nhật trạng thái chuyến bay;
- tìm booking theo số điện thoại.

Use case chỉ gọi interface, không biết MongoDB hay provider cụ thể là gì.

#### `infrastructure/`

Chứa implementation cụ thể:

- MongoDB document/schema;
- repository implementation;
- weather gateway;
- payment gateway;
- SMS/email provider;
- GPS/map integration;
- mapper chuyển đổi document <-> domain entity.

Mọi phụ thuộc ngoài hệ thống phải đi qua lớp này.

#### `presentation/`

Chứa HTTP/API layer:

- serializer/schema request-response;
- view/controller;
- route;
- auth/permission adapter cho API.

Layer này chỉ orchestration request, không chứa business rule dài.

### 3.3 Bounded context đề xuất

#### `catalog`

Quản lý gói dịch vụ, nội dung hiển thị và điều kiện tham gia.

#### `bookings`

Xử lý tạo booking, xác nhận, từ chối, tìm booking theo phone, ghi chú, số người.

#### `availability`

Quản lý lịch theo ngày/khung giờ, trạng thái còn chỗ hoặc đầy, khóa ngày, rule capacity và kết hợp weather snapshot.

#### `payments`

Quản lý thanh toán tiền mặt, online, webhook, giảm giá cho online payment.

#### `tracking`

Quản lý trạng thái hành trình bay, GPS position, route points và timeline.

#### `notifications`

Email/SMS và các template thông báo khi booking được xác nhận hoặc từ chối.

#### `users`

Quản lý tài khoản admin/staff, role, quyền và authentication.

## 4. Frontend layout

Customer app và admin app dùng cùng tư duy:

- `app/`: bootstrap app, router, provider, global style
- `pages/`: page-level composition
- `widgets/`: các block UI lớn cho page
- `features/`: hành vi nghiệp vụ có thể tái sử dụng
- `entities/`: model và UI bám theo entity
- `shared/`: lib, config, hooks, constants, primitives

### 4.1 Customer app

```text
apps/customer-web/src
|-- app/
|-- pages/
|   |-- home/
|   |-- about/
|   |-- services/
|   |-- service-detail/
|   |-- booking/
|   |-- checkout/
|   `-- tracking/
|-- widgets/
|   |-- layout/
|   |-- hero/
|   |-- service-card/
|   |-- booking-calendar/
|   `-- tracking-map/
|-- features/
|   |-- browse-services/
|   |-- select-slot/
|   |-- create-booking/
|   |-- choose-payment-method/
|   |-- track-booking/
|   `-- contact-business/
|-- entities/
|   |-- service-package/
|   |-- booking/
|   |-- availability-slot/
|   |-- weather/
|   |-- payment/
|   `-- flight-tracking/
`-- shared/
```

### 4.2 Admin app

```text
apps/admin-web/src
|-- app/
|-- pages/
|   |-- booking-requests/
|   |-- bookings/
|   |-- services/
|   `-- service-detail/
|-- widgets/
|   |-- layout/
|   |-- sidebar/
|   |-- data-table/
|   `-- booking-calendar/
|-- features/
|   |-- review-booking-request/
|   |-- update-flight-status/
|   |-- manage-service-package/
|   `-- contact-customer/
|-- entities/
|   |-- service-package/
|   |-- booking-request/
|   |-- booking/
|   `-- flight-status/
`-- shared/
```

### 4.3 Pilot app

```text
apps/pilot-web/src
|-- app/
|-- pages/
|   `-- flights/
|-- widgets/
|   `-- layout/
|-- features/
|   `-- update-flight-status/
|-- entities/
|   |-- assigned-flight/
|   `-- pilot-profile/
`-- shared/
```

## 5. Shared packages

### `packages/ui`

Chứa design token, button, modal, input, table, badge, calendar cell, layout primitive. Không chứa business logic.

### `packages/api-client`

Chứa HTTP client, query key, API adapter dùng chung cho customer/admin.

### `packages/config`

Chứa ESLint config, TypeScript base config, có thể thêm Prettier hoặc Vitest config dùng chung.

## 6. Rule phụ thuộc bắt buộc

### Backend

Phụ thuộc chỉ được đi theo chiều:

`presentation -> application -> domain`

`infrastructure -> domain` và `infrastructure -> application interfaces`

Không cho phép:

- `domain` import `django.*`, `rest_framework.*`, `mongoengine.*` hoặc Mongo document
- `application` import trực tiếp weather SDK, payment SDK, SMS SDK
- `presentation` gọi thẳng Mongo collection

### Frontend

Phụ thuộc đi từ trên xuống:

`pages -> widgets -> features -> entities -> shared`

Không cho phép:

- `shared` import ngược `features` hoặc `pages`
- page tự gọi fetch nếu đã có API adapter ở `shared/api` hoặc `packages/api-client`
- hard-code role check, route string, status label rải rác nhiều nơi

## 7. Chống hard-code từ đầu

Phải gom tập trung các phần sau:

- route path
- API endpoint path
- booking status map
- payment method config
- weather condition label
- contact info doanh nghiệp
- min age rule
- giá khuyến mại cho thanh toán online
- map provider key, payment provider key, SMS/email provider config

Đặt tại:

- backend: `shared/` hoặc config theo module
- frontend: `shared/config`, `shared/constants`, `entities/*/model`

## 8. Hướng bootstrap tiếp theo

Sau khi chốt cấu trúc thư mục, bước tiếp theo nên làm theo thứ tự:

1. Bootstrap `apps/backend` với Django + DRF + MongoDB backend.
2. Dựng OpenAPI contract cho `catalog`, `bookings`, `availability`.
3. Bootstrap `apps/customer-web` và `apps/admin-web` bằng React + TypeScript.
4. Tạo `packages/ui` và `packages/api-client`.
5. Code dọc theo vertical slice đầu tiên: `catalog -> service detail -> availability calendar -> booking`.
