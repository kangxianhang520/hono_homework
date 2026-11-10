import type { ComponentProps, ComponentType } from "react";

import { cn } from "@/lib/cn";

export type IconComponent = ComponentType<ComponentProps<"span">>;

// Use the same Material Symbols glyphs and optical sizing as the Stitch source.
function symbol(name: string): IconComponent {
	return function DesignIcon({ className, style, ...props }) {
		const size = className?.match(
			/(?:^|\s)size-(?:\[(\d+)px\]|([\d.]+))(?:\s|$)/,
		);
		const pixels = size?.[1] ? Number(size[1]) : Number(size?.[2] ?? 6) * 4;
		return (
			<span
				aria-hidden="true"
				className={cn("design-icon", className)}
				style={{ fontSize: pixels, ...style }}
				{...props}
			>
				{name}
			</span>
		);
	};
}

export const BookOpen = symbol("menu_book");
export const ChevronDown = symbol("expand_more");
export const History = symbol("history");
export const IdCard = symbol("badge");
export const KeyRound = symbol("vpn_key");
export const Key = symbol("key");
export const SquareTerminal = symbol("terminal");
export const Brush = symbol("cleaning_services");
export const TriangleAlert = symbol("warning");
export const CircleCheck = symbol("check_circle");
export const CircleQuestionMark = symbol("help");
export const Copy = symbol("content_copy");
export const Download = symbol("download");
export const Eye = symbol("visibility");
export const EyeOff = symbol("visibility_off");
export const Gauge = symbol("speed");
export const Lock = symbol("lock");
export const RefreshCw = symbol("sync");
export const BadgeCheck = symbol("verified");
export const Braces = symbol("data_object");
export const Building2 = symbol("corporate_fare");
export const CalendarDays = symbol("calendar_month");
export const Link = symbol("link");
export const MapPin = symbol("location_on");
export const CirclePlus = symbol("add_circle");
export const Search = symbol("search");
export const Trash2 = symbol("delete");
export const Network = symbol("account_tree");
export const Lightbulb = symbol("tips_and_updates");
export const ListPlus = symbol("add_task");
export const Save = symbol("save");
export const X = symbol("close");
export const FileSearch = symbol("search_off");
