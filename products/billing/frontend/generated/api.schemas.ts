/**
 * Auto-generated from the Django backend OpenAPI schema.
 * To modify these types, update the Django serializers or views, then run:
 *   hogli build:openapi
 * Questions or issues? #team-devex on Slack
 *
 * PostHog API - generated
 * OpenAPI spec version: 1.0.0
 */
export type BillingOverviewResponseApiProductsItem = { [key: string]: unknown }

export interface BillingOverviewResponseApi {
    /** @nullable */
    customer_id?: string | null
    /** @nullable */
    billing_plan?: string | null
    /** @nullable */
    subscription_level?: string | null
    has_active_subscription?: boolean
    deactivated?: boolean
    is_annual_plan_customer?: boolean
    /** @nullable */
    free_trial_until?: string | null
    current_total_amount_usd?: number
    current_total_amount_usd_after_discount?: number
    projected_total_amount_usd?: number
    projected_total_amount_usd_after_discount?: number
    projected_total_amount_usd_with_limit?: number
    projected_total_amount_usd_with_limit_after_discount?: number
    discount_amount_usd?: number
    discount_percent?: number
    /** @nullable */
    amount_off_expires_at?: string | null
    /** @nullable */
    startup_program_label?: string | null
    /** @nullable */
    startup_program_label_previous?: string | null
    /** @nullable */
    stripe_portal_url?: string | null
    /** @nullable */
    external_billing_provider_invoices_url?: string | null
    /** Subscribed and available products/addons with pricing, plan, limit, usage, and entitlement metadata. */
    products?: BillingOverviewResponseApiProductsItem[]
    available_product_features?: string[]
    usage_summary?: unknown
    billing_period?: unknown
    custom_limits_usd?: unknown
    next_period_custom_limits_usd?: unknown
    trial?: unknown
    license?: unknown
    account_owner?: unknown
    customer_trust_scores?: unknown
    never_drop_data?: boolean
}

export interface BillingApi {
    /** @maxLength 100 */
    plan: string
    billing_limit: number
}

export interface PatchedBillingApi {
    /** @maxLength 100 */
    plan?: string
    billing_limit?: number
}

export interface BillingPeriodResponseApi {
    /**
     * Start of the organization's current billing period, or null when billing has not synced a period.
     * @nullable
     */
    current_period_start: string | null
    /**
     * End of the organization's current billing period, or null when billing has not synced a period.
     * @nullable
     */
    current_period_end: string | null
}

/**
 * * `type` - type
 * * `team` - team
 * * `multiple` - multiple
 */
export type BreakdownTypeEnumApi = (typeof BreakdownTypeEnumApi)[keyof typeof BreakdownTypeEnumApi]

export const BreakdownTypeEnumApi = {
    Type: 'type',
    Team: 'team',
    Multiple: 'multiple',
} as const

export interface BillingTimeSeriesPointApi {
    id?: number
    label?: string
    data?: number[]
    dates?: string[]
    breakdown_type?: BreakdownTypeEnumApi | null
    breakdown_value?: unknown
}

export interface BillingTimeSeriesResponseApi {
    status?: string
    type?: string
    customer_id?: number
    results: BillingTimeSeriesPointApi[]
    team_id_options?: number[]
    next?: string
}

export type BillingSpendRetrieveParams = {
    /**
     * JSON-encoded array of breakdown dimensions. Valid values are "type" and "team", for example ["type","team"]. Omit for a single aggregate series.
     * @nullable
     */
    breakdowns?: string | null
    /**
     * @nullable
     */
    end_date?: string | null
    /**
     * @nullable
     */
    interval?: string | null
    /**
     * @nullable
     */
    start_date?: string | null
    /**
     * JSON-encoded array of numeric team/project IDs to filter on, for example [1,2]. Omit for all teams in the organization.
     * @nullable
     */
    team_ids?: string | null
    /**
     * JSON-encoded array of usage type identifiers to filter on. Valid values: event_count_in_period, exceptions_captured_in_period, recording_count_in_period, rows_synced_in_period, free_historical_rows_synced_in_period, survey_responses_count_in_period, mobile_recording_count_in_period, billable_feature_flag_requests_count_in_period, enhanced_persons_event_count_in_period, ai_event_count_in_period, cdp_billable_invocations_in_period, rows_exported_in_period, ai_credits_used_in_period, signals_credits_used_in_period, posthog_code_credits_used_in_period, posthog_code_token_credits_used_in_period, sandbox_compute_credits_used_in_period, sandbox_compute_cpu_millicore_seconds_in_period, sandbox_compute_memory_mib_seconds_in_period, workflow_emails_sent_in_period, workflow_billable_invocations_in_period, logs_mb_in_period, logs_retention_30d_mb_in_period, replay_vision_credits_used_in_period, data_pipelines, group_analytics. E.g. ["event_count_in_period","recording_count_in_period"]. Omit for all types.
     * @nullable
     */
    usage_types?: string | null
}

export type BillingUsageRetrieveParams = {
    /**
     * JSON-encoded array of breakdown dimensions. Valid values are "type" and "team", for example ["type","team"]. Omit for a single aggregate series.
     * @nullable
     */
    breakdowns?: string | null
    /**
     * @nullable
     */
    end_date?: string | null
    /**
     * @nullable
     */
    interval?: string | null
    /**
     * @nullable
     */
    start_date?: string | null
    /**
     * JSON-encoded array of numeric team/project IDs to filter on, for example [1,2]. Omit for all teams in the organization.
     * @nullable
     */
    team_ids?: string | null
    /**
     * JSON-encoded array of usage type identifiers to filter on. Valid values: event_count_in_period, exceptions_captured_in_period, recording_count_in_period, rows_synced_in_period, free_historical_rows_synced_in_period, survey_responses_count_in_period, mobile_recording_count_in_period, billable_feature_flag_requests_count_in_period, enhanced_persons_event_count_in_period, ai_event_count_in_period, cdp_billable_invocations_in_period, rows_exported_in_period, ai_credits_used_in_period, signals_credits_used_in_period, posthog_code_credits_used_in_period, posthog_code_token_credits_used_in_period, sandbox_compute_credits_used_in_period, sandbox_compute_cpu_millicore_seconds_in_period, sandbox_compute_memory_mib_seconds_in_period, workflow_emails_sent_in_period, workflow_billable_invocations_in_period, logs_mb_in_period, logs_retention_30d_mb_in_period, replay_vision_credits_used_in_period, data_pipelines, group_analytics. E.g. ["event_count_in_period","recording_count_in_period"]. Omit for all types.
     * @nullable
     */
    usage_types?: string | null
}
