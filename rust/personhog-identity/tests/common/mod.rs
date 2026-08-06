// Shared by every integration-test binary; each binary compiles its own copy
// and none of them uses every helper.
#![allow(dead_code)]

pub mod sim_leader;

use std::sync::Arc;

use rand::Rng;
use sqlx::postgres::PgPool;

use personhog_identity::storage::postgres::PostgresIdentityStorage;

pub struct TestContext {
    pub pool: PgPool,
    pub storage: Arc<PostgresIdentityStorage>,
    pub team_id: i64,
}

impl TestContext {
    pub async fn new() -> Self {
        let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
            "postgres://posthog:posthog@localhost:5432/posthog_persons".to_string()
        });
        let pool = PgPool::connect(&database_url)
            .await
            .expect("Failed to connect to test database");
        let storage = Arc::new(PostgresIdentityStorage::new(pool.clone()));
        let team_id = rand::thread_rng().gen_range(1_000_000..100_000_000);
        Self {
            pool,
            storage,
            team_id,
        }
    }

    /// Inserts a person with a random (non-deterministic) uuid plus a distinct
    /// id row pointing at it. Returns the person id.
    pub async fn insert_person_with_distinct_id(&self, distinct_id: &str) -> i64 {
        let person_id: i64 = sqlx::query_scalar(
            r#"
            INSERT INTO posthog_person
                (created_at, properties, properties_last_updated_at, properties_last_operation,
                 team_id, is_identified, uuid, version)
            VALUES (now(), '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, $1, false, gen_random_uuid(), 0)
            RETURNING id
            "#,
        )
        .bind(self.team_id as i32)
        .fetch_one(&self.pool)
        .await
        .expect("Failed to insert person");

        sqlx::query(
            r#"
            INSERT INTO posthog_persondistinctid (distinct_id, person_id, team_id, version)
            VALUES ($1, $2, $3, 0)
            "#,
        )
        .bind(distinct_id)
        .bind(person_id)
        .bind(self.team_id as i32)
        .execute(&self.pool)
        .await
        .expect("Failed to insert distinct id");

        person_id
    }

    /// An engine over this context's pool, tuned for tests: a short poll
    /// so contention tests run in milliseconds, and a lease long enough
    /// that a live test's op never looks expired to the suite's single
    /// sweep test (in lifecycle_merge_tests), which would otherwise claim
    /// and drive it with the wrong harness. Lease-expiry tests seed
    /// explicit lease_expires_at values instead of waiting this out.
    pub fn engine(&self) -> personhog_identity::lifecycle::engine::Engine {
        personhog_identity::lifecycle::engine::Engine::new(
            self.pool.clone(),
            personhog_identity::lifecycle::engine::EngineConfig {
                lease: std::time::Duration::from_secs(300),
                execute_timeout: std::time::Duration::from_secs(10),
                poll_interval: std::time::Duration::from_millis(25),
                attempt_alert_threshold: 5,
            },
        )
    }

    pub async fn cleanup(&self) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM lifecycle_op WHERE team_id = $1")
            .bind(self.team_id as i32)
            .execute(&self.pool)
            .await?;
        sqlx::query("DELETE FROM posthog_persondistinctid WHERE team_id = $1")
            .bind(self.team_id as i32)
            .execute(&self.pool)
            .await?;
        sqlx::query("DELETE FROM posthog_person WHERE team_id = $1")
            .bind(self.team_id as i32)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

/// Leader-surface stubs for test binaries whose flows never reach the
/// leader: an accidental call surfaces as a clean unimplemented error
/// instead of a hang or a panic mid-transaction.
pub struct UnusedLeader;

#[async_trait::async_trait]
impl personhog_identity::leader::PropertyWriter for UnusedLeader {
    async fn update_person_properties(
        &self,
        _request: personhog_proto::personhog::types::v1::UpdatePersonPropertiesRequest,
    ) -> Result<personhog_proto::personhog::types::v1::UpdatePersonPropertiesResponse, tonic::Status>
    {
        Err(tonic::Status::unimplemented("not exercised by this test"))
    }
}

#[async_trait::async_trait]
impl personhog_identity::leader::LifecycleLeader for UnusedLeader {
    async fn fence_person(
        &self,
        _request: personhog_proto::personhog::types::v1::FencePersonRequest,
    ) -> Result<personhog_proto::personhog::types::v1::FencePersonResponse, tonic::Status> {
        Err(tonic::Status::unimplemented("not exercised by this test"))
    }

    async fn release_fence(
        &self,
        _request: personhog_proto::personhog::types::v1::ReleaseFenceRequest,
    ) -> Result<personhog_proto::personhog::types::v1::ReleaseFenceResponse, tonic::Status> {
        Err(tonic::Status::unimplemented("not exercised by this test"))
    }

    async fn fold_person_document(
        &self,
        _request: personhog_proto::personhog::types::v1::FoldPersonDocumentRequest,
    ) -> Result<personhog_proto::personhog::types::v1::FoldPersonDocumentResponse, tonic::Status>
    {
        Err(tonic::Status::unimplemented("not exercised by this test"))
    }
}

/// IdentityStorage stub for validation-only test binaries: any call means
/// validation failed to reject first.
pub struct UnusedStorage;

#[async_trait::async_trait]
impl personhog_identity::storage::IdentityStorage for UnusedStorage {
    async fn resolve_distinct_ids(
        &self,
        _keys: &[(i64, String)],
    ) -> personhog_identity::storage::StorageResult<
        std::collections::HashMap<(i64, String), personhog_identity::storage::Person>,
    > {
        panic!("not exercised by this test")
    }

    async fn create_person_stubs(
        &self,
        _stubs: &[personhog_identity::storage::PersonStub],
    ) -> personhog_identity::storage::StorageResult<Vec<personhog_identity::storage::StubOutcome>>
    {
        panic!("not exercised by this test")
    }
}
