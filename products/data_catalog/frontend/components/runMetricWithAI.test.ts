import { buildMetricRunPrompt } from './RunMetricWithAIButton'

describe('buildMetricRunPrompt', () => {
    it('tells the agent to read the definition from the catalog instead of carrying it', () => {
        const prompt = buildMetricRunPrompt('weekly_paying_customers')

        // Attached context only reaches the sandbox send path, so the prompt has to stand alone.
        expect(prompt).toContain("system.information_schema.metrics where name = 'weekly_paying_customers'")
        expect(prompt).toContain('weekly_paying_customers')
    })
})
