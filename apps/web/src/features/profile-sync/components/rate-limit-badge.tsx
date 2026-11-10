import { Badge } from "@/components/ui/badge";
import { Gauge } from "@/components/ui/design-icons";
import { useGitHubSync } from "../sync-context";

/** Token 卡片内的 Rate Limit 标签，无数据时显示 `— / —`。 */
export function RateLimitBadge() {
	const { snapshot } = useGitHubSync();
	const rl = snapshot?.rateLimit;
	return (
		<Badge tone="neutral" className="gap-1">
			<Gauge className="size-3.5" />
			{rl
				? `${rl.remaining.toLocaleString()} / ${rl.limit.toLocaleString()} req/hr`
				: "— / — req/hr"}
		</Badge>
	);
}
