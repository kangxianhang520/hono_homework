import { type ReactNode, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapse } from "@/components/ui/collapse";
import {
	BadgeCheck,
	Braces,
	Building2,
	CalendarDays,
	type IconComponent,
	Link,
	MapPin,
} from "@/components/ui/design-icons";
import { cn } from "@/lib/cn";

import type { GitHubProfile } from "../data";
import { RawJsonPanel } from "./raw-json-panel";

function MetaItem({
	icon: Icon,
	children,
}: {
	icon: IconComponent;
	children: ReactNode;
}) {
	return (
		<span className="flex items-center gap-1">
			<Icon className="text-on-surface-variant size-4" />
			{children}
		</span>
	);
}

function StatTile({ value, label }: { value: number; label: string }) {
	return (
		<div className="bg-surface-container flex min-w-20 flex-col items-center justify-center rounded-sm p-3">
			<span className="text-headline-md text-on-surface font-bold">
				{value.toLocaleString()}
			</span>
			<span className="text-label-sm text-on-surface-variant font-mono uppercase">
				{label}
			</span>
		</div>
	);
}

/** Section 2 — fetched GitHub identity, metrics, and raw JSON drawer. */
export function ProfileCard({ profile }: { profile: GitHubProfile }) {
	const [showJson, setShowJson] = useState(false);
	const blogHost = new URL(profile.blog).host;

	return (
		<Card surface="low">
			<div className="gap-space-lg flex flex-col items-start justify-between lg:flex-row lg:items-center">
				{/* Identity */}
				<div className="gap-space-lg flex items-start md:items-center">
					<div className="relative shrink-0 lg:shrink">
						<Avatar
							src={profile.avatar_url}
							name={profile.name}
							className="text-headline-md size-20 rounded-[12px] shadow-lg md:size-24"
						/>
						<span className="bg-surface-container-lowest absolute right-0 bottom-0 flex size-6 items-center justify-center rounded-full shadow">
							<span className="bg-tertiary size-3.5 rounded-full" />
						</span>
					</div>

					<div className="space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-headline-lg text-on-surface font-bold">
								{profile.name}
							</h1>
							<span className="text-label-md text-secondary font-mono">
								@{profile.login}
							</span>
							<Badge tone="primary" shape="compact" className="uppercase">
								Pro
							</Badge>
							<Badge tone="success" shape="compact" className="gap-1">
								<BadgeCheck className="size-[13px]" />
								Verified Email
							</Badge>
						</div>
						<p className="text-body-md text-on-surface-variant max-w-2xl">
							{profile.bio}
						</p>
						<div className="text-body-sm text-outline flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
							<MetaItem icon={Building2}>
								<span className="text-on-surface">{profile.company}</span>
							</MetaItem>
							<MetaItem icon={MapPin}>{profile.location}</MetaItem>
							<MetaItem icon={CalendarDays}>
								注册于 {profile.created_at.slice(0, 10)}
							</MetaItem>
							<MetaItem icon={Link}>
								<a
									href={profile.blog}
									target="_blank"
									rel="noreferrer"
									className="text-secondary hover:underline"
								>
									{blogHost}
								</a>
							</MetaItem>
						</div>
					</div>
				</div>

				{/* Metrics + raw JSON trigger */}
				<div className="gap-space-md flex w-full flex-col items-stretch justify-between self-stretch md:flex-row md:items-end lg:w-auto lg:flex-col lg:self-auto">
					<div className="grid w-full grid-cols-3 gap-2 lg:w-auto">
						<StatTile value={profile.public_repos} label="Repos" />
						<StatTile value={profile.followers} label="Followers" />
						<StatTile value={profile.following} label="Following" />
					</div>
					<button
						type="button"
						aria-expanded={showJson}
						aria-controls="raw-json-panel"
						onClick={() => setShowJson((v) => !v)}
						className={cn(
							"text-label-md flex w-full items-center justify-center gap-1.5 rounded-sm px-3.5 py-2 font-mono transition-colors lg:w-auto",
							showJson
								? "bg-primary-container text-on-primary-container"
								: "bg-surface-container-high text-on-surface hover:bg-surface-variant",
						)}
					>
						<Braces className={cn("size-4", !showJson && "text-secondary")} />
						{showJson ? "收起原始 API JSON 响应" : "展示原始 API JSON 响应"}
					</button>
				</div>
			</div>

			<Collapse
				open={showJson}
				id="raw-json-panel"
				className={showJson ? "mt-space-lg" : "mt-0"}
			>
				<RawJsonPanel
					data={profile}
					endpoint="GET https://api.github.com/user (HTTP 200 OK)"
				/>
			</Collapse>
		</Card>
	);
}
