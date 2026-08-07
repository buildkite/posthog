import { IconSparkles } from '@posthog/icons'

import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { AIConsentPopoverWrapper } from 'scenes/settings/organization/AIConsentPopoverWrapper'

/**
 * Point the agent at the catalog rather than pasting the definition into the prompt. The definition
 * is project data an agent must treat as untrusted, and attached context only reaches the sandbox
 * send path, so inlining it would break on the legacy one. Reading it back from
 * `information_schema.metrics` works on both and keeps the governed row as the single source.
 */
export function buildMetricRunPrompt(metricName: string): string {
    // Our own text plus the metric name, which the name regex limits to [A-Za-z0-9_].
    return [
        `Calculate the "${metricName}" metric for this project.`,
        `Read its definition first: select definition, description, unit from system.information_schema.metrics where name = '${metricName}'.`,
        'Follow those steps to compute the metric, then report the number and the query you ran.',
    ].join(' ')
}

export function RunMetricWithAIButton({
    onRun,
    disabledReason,
}: {
    onRun: () => void
    disabledReason?: string
}): JSX.Element {
    return (
        <AIConsentPopoverWrapper onApprove={onRun}>
            <LemonButton
                type="primary"
                size="small"
                icon={<IconSparkles />}
                sideIcon={null}
                onClick={onRun}
                disabledReason={disabledReason}
                data-attr="data-catalog-run-metric-with-ai"
            >
                Run with AI
            </LemonButton>
        </AIConsentPopoverWrapper>
    )
}
