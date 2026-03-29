from __future__ import annotations

from modules.notifications.infrastructure.persistence.mongo.documents import NotificationLogDocument


class MongoNotificationLogRepository:
    def create(self, *, channel: str, recipient: str, title: str, message: str) -> None:
        NotificationLogDocument.objects.create(
            channel=channel,
            recipient=recipient,
            title=title,
            message=message,
        )
