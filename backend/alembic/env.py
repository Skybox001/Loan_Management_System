from logging.config import fileConfig
from alembic import context
from sqlalchemy import engine_from_config, pool, text

import sys
import os

sys.path.append(os.getcwd())

from app.core.config import settings
from app.models import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    is_postgres = url.startswith("postgresql")
    opts = {
        "url": url,
        "target_metadata": target_metadata,
        "literal_binds": True,
        "dialect_opts": {"paramstyle": "named"},
    }
    if is_postgres:
        opts["version_table_schema"] = "lms"
        opts["include_schemas"] = True

    context.configure(**opts)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    is_postgres = settings.DATABASE_URL.startswith("postgresql")
    connect_args = {}
    if is_postgres:
        connect_args["options"] = "-c search_path=lms,public"

    configuration = config.get_section(config.config_ini_section, {})
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )
    with connectable.connect() as connection:
        if is_postgres:
            connection.execute(text("CREATE SCHEMA IF NOT EXISTS lms;"))
            connection.execute(text("SET search_path TO lms, public;"))
            connection.commit()
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                version_table_schema="lms",
                include_schemas=True,
            )
        else:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
            )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()