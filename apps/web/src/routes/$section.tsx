import { Construction } from "lucide-react";
import { data, Link } from "react-router";

import { NAV_ITEMS } from "@/components/layout/app-sidebar";
import { Card } from "@/components/ui/card";

import type { Route } from "./+types/$section";

export function loader({ params }: Route.LoaderArgs) {
	const item = NAV_ITEMS.find((nav) => nav.to === `/${params.section}`);
	if (!item) throw data(null, { status: 404 });
	return { label: item.label };
}

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{
			title: `${loaderData?.label ?? "Not found"} · GitHub Profile Sync & Fields Hub`,
		},
	];
}

/** Placeholder for sidebar sections that are not designed yet. */
export default function SectionPlaceholder({
	loaderData,
}: Route.ComponentProps) {
	return (
		<Card className="flex flex-col items-center gap-2 py-16 text-center">
			<Construction className="text-outline mb-2 size-9" />
			<h1 className="text-headline-md text-on-surface font-semibold">
				{loaderData.label}
			</h1>
			<p className="text-body-sm text-on-surface-variant">
				该模块正在建设中，敬请期待。
			</p>
			<Link
				to="/"
				className="text-label-md text-primary mt-2 font-mono hover:underline"
			>
				← 返回账户概览
			</Link>
		</Card>
	);
}
