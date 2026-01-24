import { ConsensusAggregationByFields, cre, type HTTPSendRequester, median, Runner, type Runtime} from '@chainlink/cre-sdk'
import { z } from 'zod'

const configSchema = z.object({
	url: z.string(),
	schedule: z.string(),
})
type Config = z.infer<typeof configSchema>

interface Response {
	totalToken: number
	updatedAt: string
}

// unfortunately we don't support individual aggregation of list elements yet
// so we need to store each element in a separate field
// this can be simplified using the Record<...> utility type
interface BatchToAggregateAndSign {
	reserve1: number
	reserve2: number
	reserve3: number
	reserve4: number
	reserve5: number
}

const fetchData = (sendRequester: HTTPSendRequester, config: Config): BatchToAggregateAndSign => {
	// Send 5 requests in parallel
	const pendingRequests = Array.from({ length: 5 }, () =>
		sendRequester.sendRequest({ method: 'GET', url: config.url }) // in practice URLs will differ
	)

	const reserves: number[] = []
	for (const req of pendingRequests) {
		const response = req.result() // wait for each result
		if (response.statusCode !== 200) {
			reserves.push(NaN) // NaN signals invalid data, excluded from median
			continue
		}
		const resp: Response = JSON.parse(Buffer.from(response.body).toString('utf-8'))
		reserves.push(resp.totalToken)
	}

	return {
		reserve1: reserves[0],
		reserve2: reserves[1],
		reserve3: reserves[2],
		reserve4: reserves[3],
		reserve5: reserves[4],
	}
}

const onCronTrigger = (runtime: Runtime<Config>): string => {
	runtime.log(`fetching from url ${runtime.config.url}`)

	const httpCapability = new cre.capabilities.HTTPClient()
	const reserveInfo = httpCapability
		.sendRequest(
			runtime,
			fetchData,
			ConsensusAggregationByFields<BatchToAggregateAndSign>({ // can be simplified with Record<...>
				reserve1: median,
				reserve2: median,
				reserve3: median,
				reserve4: median,
				reserve5: median,
			}),
		)(runtime.config)
		.result()

	runtime.log(`ReserveInfo ${JSON.stringify(reserveInfo)}`)
	return "success"
}

const initWorkflow = (config: Config) => {
  const cronTrigger = new cre.capabilities.CronCapability()
  return [
    cre.handler(
      cronTrigger.trigger({
        schedule: config.schedule,
      }),
      onCronTrigger
    ),
  ]
}

export async function main() {
	const runner = await Runner.newRunner<Config>({configSchema})
	await runner.run(initWorkflow)
}

main()