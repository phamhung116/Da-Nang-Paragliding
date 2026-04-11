# Strict Architecture Boundaries

This project uses a layered clean architecture boundary for backend modules and a feature-sliced boundary for frontend apps.

## Backend

Allowed dependency direction:

```text
presentation -> application -> domain
infrastructure -> domain
infrastructure -> application interfaces
config/containers.py -> every concrete implementation
```

Rules enforced by `scripts/check_architecture.py`:

- `domain` must not import Django, DRF, MongoDB backend, `application`, `infrastructure`, `presentation`, or module `models`.
- `application` must not import Django, DRF, MongoDB backend, `infrastructure`, `presentation`, or module `models`.
- `infrastructure` must not import `presentation`.
- External providers must be accessed through application ports/interfaces.
- Concrete implementations are wired only in `config/containers.py`.

Current backend patterns:

- Repository Pattern for persistence contracts.
- Use Case / Application Service Pattern for business workflows.
- Gateway / Adapter Pattern for email, payment, and notification providers.
- DTO/Payload objects for request data and persistence creation payloads.
- Manual Dependency Injection through `config/containers.py`.

## Frontend

Allowed dependency direction:

```text
app -> pages -> widgets -> features -> entities -> shared
```

Lower layers must not import higher layers. Shared providers, route constants, storage, API config, and reusable utilities stay under `shared/`.

Rules enforced by `scripts/check_architecture.py`:

- `shared` cannot import `entities`, `features`, `widgets`, `pages`, or `app`.
- `features` cannot import `widgets`, `pages`, or `app`.
- `widgets` cannot import `pages` or `app`.
- `pages` cannot import `app`.

## Check Command

Run before commits or deployment:

```powershell
npm run arch:check
```

Run together with builds:

```powershell
npm run arch:check
.\.venv\Scripts\python.exe apps\backend\manage.py check
npm run build:customer
npm run build:admin
npm run build:pilot
```
