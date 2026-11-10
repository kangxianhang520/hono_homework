import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IdCard } from "@/components/ui/design-icons";

/** 尚未同步(无 snapshot)时的画像空状态。 */
export function ProfileEmptyState() {
	const focusTokenInput = () => {
		const input = document.getElementById("pat-input");
		input?.scrollIntoView({ block: "center", behavior: "smooth" });
		input?.focus({ preventScroll: true });
	};

	return (
		<Card surface="low">
			<div className="gap-space-md flex flex-col items-center py-6 text-center">
				<IdCard className="text-outline size-10" aria-hidden="true" />
				<div className="space-y-1">
					<p className="text-headline-sm text-on-surface font-semibold">
						尚未同步 GitHub 账户
					</p>
					<p className="text-body-md text-on-surface-variant">
						填写 Personal Access Token 并同步后，这里将展示你的账户资料。
					</p>
				</div>
				<Button variant="accent" onClick={focusTokenInput}>
					前往填写 Token
				</Button>
			</div>
		</Card>
	);
}
