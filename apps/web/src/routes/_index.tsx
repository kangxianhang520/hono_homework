import { FieldsPanel } from "@/features/profile-sync/components/fields-panel";
import { FieldsTableSkeleton } from "@/features/profile-sync/components/fields-table-skeleton";
import { PageToolbar } from "@/features/profile-sync/components/page-toolbar";
import { ProfileSection } from "@/features/profile-sync/components/profile-section";
import { TokenCard } from "@/features/profile-sync/components/token-card";
import { useGitHubSync } from "@/features/profile-sync/sync-context";

import type { Route } from "./+types/_index";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "账户概览与字段管理 · GitHub Profile Sync & Fields Hub" },
		{
			name: "description",
			content: "配置 GitHub PAT，同步账户资料并管理扩展字段",
		},
	];
}

export default function ProfileOverviewPage() {
	const { status, snapshot } = useGitHubSync();
	const loading = status === "loading";
	const userLabel = snapshot
		? snapshot.user.name || snapshot.user.login
		: "未连接";

	return (
		<>
			<PageToolbar user={userLabel} page="PAT 凭证与扩展字段管理" />
			<TokenCard />
			<ProfileSection />
			{/* 骨架屏只用于首次无数据;重新同步时保持 FieldsPanel 挂载,避免丢失未提交的编辑 */}
			{loading && !snapshot ? <FieldsTableSkeleton /> : <FieldsPanel />}
		</>
	);
}
