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
    customer_id?: number | null
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

export interface PatchedBillingApi {
    /** @maxLength 100 */
    plan?: string
    billing_limit?: number
}

export interface BillingApi {
    /** @maxLength 100 */
    plan: string
    billing_limit: number
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
