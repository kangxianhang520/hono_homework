import { Badge, StatusDot } from "@/components/ui/badge";
import type { SyncStatus } from "../sync-context";

/** 三态连接标签：未连接 / 同步中 / 已验证。error 视为未连接（错误详情由 SyncErrorAlert 展示）。 */
export function ConnectionBadge({
	status,
	hasSnapshot = false,
}: {
	status: SyncStatus;
	/** 失败但仍保留上次成功快照时，仍视为已验证 */
	hasSnapshot?: boolean;
}) {
	if (status === "loading") {
		return (
			<Badge tone="neutral" role="status" aria-live="polite">
				<StatusDot className="animate-pulse" />
				同步中 / Syncing
			</Badge>
		);
	}
	if (status === "success" || (status === "error" && hasSnapshot)) {
		return (
			<Badge tone="success">
				<StatusDot />
				已验证 / Validated
			</Badge>
		);
	}
	return <Badge tone="neutral">未连接 / Not connected</Badge>;
}
