class DomainError(Exception):
    """Base exception for domain and application failures."""


class NotFoundError(DomainError):
    """Raised when an aggregate or entity cannot be found."""


class ValidationError(DomainError):
    """Raised when a business rule is violated."""
