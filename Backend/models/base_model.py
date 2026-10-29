from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


def _as_utc(value: datetime) -> datetime:
    # MySQL DATETIME values are naive; the database stores them in UTC.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


UtcDatetime = Annotated[datetime, AfterValidator(_as_utc)]


class ApiModel(BaseModel):
    """Base model - Python code uses snake_case, the JSON API uses camelCase."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
