import { FieldsPanel } from "@/features/profile-sync/components/fields-panel";
import { PageToolbar } from "@/features/profile-sync/components/page-toolbar";
import { ProfileCard } from "@/features/profile-sync/components/profile-card";
import { TokenCard } from "@/features/profile-sync/components/token-card";
import { PROFILE } from "@/features/profile-sync/data";

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
	return (
		<>
			<PageToolbar user={PROFILE.name} page="PAT 凭证与扩展字段管理" />
			<TokenCard />
			<ProfileCard profile={PROFILE} />
			<FieldsPanel />
		</>
	);
}
