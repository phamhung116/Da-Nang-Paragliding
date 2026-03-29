# Customer Web Guide

Customer app là React app riêng cho người dùng cuối.

## Nguyên tắc tổ chức

- `pages/` chỉ compose page.
- `widgets/` là block UI lớn của page.
- `features/` chứa hành vi nghiệp vụ có thể tái dùng.
- `entities/` chứa model và UI quanh entity.
- `shared/` là tầng thấp nhất, không import ngược lên trên.

## Luồng ưu tiên build trước

1. Home
2. Service list
3. Service detail + booking calendar
4. Booking form
5. Checkout
6. Tracking by phone
