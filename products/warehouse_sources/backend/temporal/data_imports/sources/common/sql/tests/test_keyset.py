from __future__ import annotations

import pytest

import pyarrow as pa

from products.warehouse_sources.backend.temporal.data_imports.sources.common.sql.identifiers import (
    BacktickIdentifierQuoter,
)
from products.warehouse_sources.backend.temporal.data_imports.sources.common.sql.keyset import (
    KeysetNullKeyError,
    is_orderable_keyset_type,
    iter_keyset_pages,
    resolve_keyset_eligibility,
)
from products.warehouse_sources.backend.temporal.data_imports.sources.common.sql.query_builder import SelectQueryBuilder

# Keyset keys must be non-nullable, so the columns under test are declared that way explicitly —
# `pa.field` defaults to nullable=True, which is itself an ineligibility (see `nullable_id`).
_FIELDS: list[pa.Field] = [
    pa.field("id", pa.int64(), nullable=False),
    pa.field("uuid", pa.string(), nullable=False),
    pa.field("created_at", pa.timestamp("us"), nullable=False),
    pa.field("amount", pa.decimal128(18, 2), nullable=False),
    pa.field("active", pa.bool_(), nullable=False),
    pa.field("day", pa.date32(), nullable=False),
    pa.field("nullable_id", pa.int64(), nullable=True),
]
_SCHEMA = pa.schema(_FIELDS)


@pytest.mark.parametrize(
    "arrow_type,expected",
    [
        (pa.int8(), True),
        (pa.int64(), True),
        (pa.uint32(), True),
        (pa.decimal128(18, 2), True),
        (pa.date32(), True),
        (pa.timestamp("us"), True),
        (pa.string(), False),  # collation-dependent order
        (pa.large_binary(), False),
        (pa.bool_(), False),
        (pa.float64(), False),  # NaN ordering / precision
    ],
)
def test_is_orderable_keyset_type(arrow_type, expected):
    assert is_orderable_keyset_type(arrow_type) is expected


@pytest.mark.parametrize(
    "primary_keys,incremental,expected_column,expected_reason",
    [
        (["id"], False, "id", None),
        (["created_at"], False, "created_at", None),
        (["amount"], False, "amount", None),
        # Incremental syncs already resume from their persisted watermark; keyset would double up.
        (["id"], True, None, "incremental_sync"),
        (None, False, None, "no_primary_key"),
        ([], False, None, "no_primary_key"),
        (["id", "created_at"], False, None, "composite_primary_key"),
        # If the PK was projected out of the Arrow schema there's nothing to seek on.
        (["missing"], False, None, "primary_key_not_projected"),
        # A string/uuid PK sorts by collation, which can skip or duplicate rows across keyset pages.
        (["uuid"], False, None, "non_orderable_type:string"),
        (["active"], False, None, "non_orderable_type:bool"),
        # A nullable key can't be seeked past: a page ending on NULL leaves nothing to compare
        # against. Reachable via the keyless-table `id` fallback, which need not be a declared PK.
        (["nullable_id"], False, None, "nullable_key_column"),
    ],
)
def test_resolve_keyset_eligibility(primary_keys, incremental, expected_column, expected_reason):
    eligibility = resolve_keyset_eligibility(
        primary_keys=primary_keys,
        arrow_schema=_SCHEMA,
        should_use_incremental_field=incremental,
    )

    assert eligibility.column == expected_column
    assert eligibility.reason == expected_reason


_BUILDER = SelectQueryBuilder(quoter=BacktickIdentifierQuoter())


def _fake_table(ids: list[int]) -> pa.Table:
    return pa.table({"id": ids, "body": [f"row-{i}" for i in ids]})


class _FakePages:
    # Serves a fixed dataset back through keyset SQL: parses `id > N` out of the built SQL, applies
    # the LIMIT, and records every query so the walk itself can be asserted.
    def __init__(self, all_ids: list[int], chunk_size: int):
        self.all_ids = sorted(all_ids)
        self.chunk_size = chunk_size
        self.queries: list[str] = []

    def run_page(self, page_sql):
        self.queries.append(page_sql.sql)
        after = page_sql.params.get("keyset_value") if isinstance(page_sql.params, dict) else None
        remaining = [i for i in self.all_ids if after is None or i > after]
        page = remaining[: self.chunk_size]
        if not page:
            return None
        return _fake_table(page)


def test_iter_keyset_pages_walks_whole_table_in_order():
    pages = _FakePages(all_ids=[1, 2, 3, 4, 5, 6, 7], chunk_size=3)
    tables = list(
        iter_keyset_pages(
            builder=_BUILDER,
            schema="db",
            table_name="t",
            keyset_column="id",
            chunk_size=3,
            run_page=pages.run_page,
            initial_last_value=None,
        )
    )
    seen = [v.as_py() for table in tables for v in table.column("id")]
    assert seen == [1, 2, 3, 4, 5, 6, 7]
    # 3 + 3 + 1: the final short page ends the walk without an extra empty query.
    assert [t.num_rows for t in tables] == [3, 3, 1]
    assert len(pages.queries) == 3


def test_iter_keyset_pages_seeks_from_initial_value():
    pages = _FakePages(all_ids=[1, 2, 3, 4, 5], chunk_size=10)
    tables = list(
        iter_keyset_pages(
            builder=_BUILDER,
            schema="db",
            table_name="t",
            keyset_column="id",
            chunk_size=10,
            run_page=pages.run_page,
            initial_last_value=3,
        )
    )
    seen = [v.as_py() for table in tables for v in table.column("id")]
    assert seen == [4, 5]  # rows <= the resume checkpoint are never re-read


def test_iter_keyset_pages_stops_immediately_when_empty():
    pages = _FakePages(all_ids=[], chunk_size=5)
    tables = list(
        iter_keyset_pages(
            builder=_BUILDER,
            schema="db",
            table_name="t",
            keyset_column="id",
            chunk_size=5,
            run_page=pages.run_page,
            initial_last_value=None,
        )
    )
    assert tables == []
    assert len(pages.queries) == 1


def test_iter_keyset_pages_full_page_then_empty_terminates():
    # An exact multiple of chunk_size needs one extra (empty) query to learn it's done.
    pages = _FakePages(all_ids=[1, 2, 3, 4], chunk_size=2)
    tables = list(
        iter_keyset_pages(
            builder=_BUILDER,
            schema="db",
            table_name="t",
            keyset_column="id",
            chunk_size=2,
            run_page=pages.run_page,
            initial_last_value=None,
        )
    )
    seen = [v.as_py() for table in tables for v in table.column("id")]
    assert seen == [1, 2, 3, 4]
    assert len(pages.queries) == 3  # [>none], [>2], [>4 -> empty]


def test_checkpoint_records_each_page_only_once_the_consumer_takes_the_next():
    # Generator laziness is the contract: a page that has been read but not yet handed on must not
    # move the checkpoint, or an abandoned walk would resume past rows the consumer never saw.
    pages = _FakePages(all_ids=[1, 2, 3, 4, 5], chunk_size=2)
    saved: list[int] = []
    walk = iter_keyset_pages(
        builder=_BUILDER,
        schema="db",
        table_name="t",
        keyset_column="id",
        chunk_size=2,
        run_page=pages.run_page,
        initial_last_value=None,
        checkpoint=saved.append,
    )

    next(walk)
    assert saved == []  # first page read, consumer hasn't come back for more

    next(walk)
    assert saved == [2]  # ...and now it has

    assert [v.as_py() for table in walk for v in table.column("id")] == [5]
    assert saved == [2, 4, 5]


def test_checkpoint_is_optional():
    pages = _FakePages(all_ids=[1, 2], chunk_size=5)
    tables = list(
        iter_keyset_pages(
            builder=_BUILDER,
            schema="db",
            table_name="t",
            keyset_column="id",
            chunk_size=5,
            run_page=pages.run_page,
            initial_last_value=None,
        )
    )
    assert [t.num_rows for t in tables] == [2]


def test_null_page_boundary_raises_instead_of_replaying_the_page():
    """A page ending on a NULL key must stop the walk, not re-issue an unbounded query.

    Without the guard `last_value` falls back to None, the next page is built with no seek
    predicate, and the same rows come back forever — an unbounded rewrite loop a source owner
    could trigger with a nullable key column.
    """
    queries: list[str] = []

    def run_page(page_sql):
        queries.append(page_sql.sql)
        return pa.table({"id": pa.array([1, None], type=pa.int64())})

    walk = iter_keyset_pages(
        builder=_BUILDER,
        schema="db",
        table_name="t",
        keyset_column="id",
        chunk_size=2,
        run_page=run_page,
        initial_last_value=None,
    )

    assert next(walk).num_rows == 2  # the page itself is still handed to the consumer

    with pytest.raises(KeysetNullKeyError):
        next(walk)

    assert len(queries) == 1  # crucially, no second query was ever issued
