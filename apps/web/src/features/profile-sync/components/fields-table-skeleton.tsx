import { Skeleton } from "@/components/ui/skeleton";

const ROWS = ["r1", "r2", "r3", "r4", "r5"];

/** FieldsTable 加载占位（5 行）。 */
export function FieldsTableSkeleton() {
	return (
		<div
			role="status"
			aria-busy="true"
			aria-label="正在加载字段"
			className="bg-surface-container-lowest divide-surface-container-highest/20 divide-y rounded-sm shadow-sm"
		>
			{ROWS.map((id) => (
				<div key={id} className="flex items-center gap-4 px-4 py-3">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-5 flex-1" />
					<Skeleton className="h-5 w-16" />
					<Skeleton className="h-5 w-20" />
				</div>
			))}
		</div>
	);
}
