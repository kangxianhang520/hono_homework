import { useMemo, useState } from "react";

import { Dialog } from "@/components/ui/dialog";

import { toProfileViewModel } from "../lib/profile-view-model";
import { useGitHubSync } from "../sync-context";
import { ProfileCard } from "./profile-card";
import { ProfileCardSkeleton } from "./profile-card-skeleton";
import { ProfileEmptyState } from "./profile-empty-state";
import { RawJsonPanel } from "./raw-json-panel";

/** Section 2 容器:骨架屏(首次无数据加载) / 空状态 / 画像卡片。 */
export function ProfileSection() {
	const { status, snapshot, hydrated } = useGitHubSync();
	const [jsonOpen, setJsonOpen] = useState(false);
	const profile = useMemo(
		() => (snapshot ? toProfileViewModel(snapshot) : null),
		[snapshot],
	);

	if (!profile || !snapshot) {
		if (!hydrated || status === "loading") return <ProfileCardSkeleton />;
		return <ProfileEmptyState />;
	}

	// 有旧数据时同步中保持卡片挂载,避免闪回骨架
	return (
		<>
			<ProfileCard
				profile={profile}
				online={status === "success"}
				onShowJson={() => setJsonOpen(true)}
			/>
			<Dialog
				open={jsonOpen}
				onClose={() => setJsonOpen(false)}
				title="原始 API JSON 响应"
			>
				<RawJsonPanel
					data={snapshot.user}
					endpoint="GET https://api.github.com/user (HTTP 200 OK)"
				/>
			</Dialog>
		</>
	);
}
