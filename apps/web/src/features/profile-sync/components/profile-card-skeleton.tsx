import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** ProfileCard 加载占位，布局与 ProfileCard 对齐。 */
export function ProfileCardSkeleton() {
	return (
		<Card
			surface="low"
			role="status"
			aria-busy="true"
			aria-label="正在加载账户资料"
		>
			<div className="gap-space-lg flex flex-col items-start justify-between lg:flex-row lg:items-center">
				<div className="gap-space-lg flex items-start md:items-center">
					<Skeleton className="size-20 shrink-0 rounded-[12px] md:size-24" />
					<div className="space-y-2">
						<Skeleton className="h-7 w-64 max-w-full" />
						<Skeleton className="h-4 w-80 max-w-full" />
						<Skeleton className="h-4 w-56 max-w-full" />
					</div>
				</div>
				<div className="grid w-full grid-cols-3 gap-2 lg:w-auto">
					<Skeleton className="h-16 min-w-20" />
					<Skeleton className="h-16 min-w-20" />
					<Skeleton className="h-16 min-w-20" />
				</div>
			</div>
		</Card>
	);
}
