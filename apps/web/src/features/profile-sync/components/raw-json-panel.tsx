import { Copy } from "@/components/ui/design-icons";

import { useClipboard } from "@/hooks/use-clipboard";

type RawJsonPanelProps = {
	data: unknown;
	endpoint: string;
};

/** Terminal-style viewer for the raw API response. */
export function RawJsonPanel({ data, endpoint }: RawJsonPanelProps) {
	const copy = useClipboard();
	const json = JSON.stringify(data, null, 2);

	return (
		<div className="bg-surface-container-lowest p-space-md text-code-inline rounded-sm font-mono">
			<div className="text-outline mb-2 flex items-center justify-between pb-2">
				<div className="flex items-center gap-2">
					<span className="bg-error size-2.5 rounded-full" />
					<span className="bg-secondary size-2.5 rounded-full" />
					<span className="bg-tertiary size-2.5 rounded-full" />
					<span className="text-label-sm text-on-surface-variant ml-2">
						{endpoint}
					</span>
				</div>
				<button
					type="button"
					onClick={() => copy(json, "原始 JSON 响应已成功复制", "success")}
					className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
				>
					<Copy className="size-[15px]" />
					复制全部
				</button>
			</div>
			<pre className="no-scrollbar text-on-surface selection:bg-primary-container selection:text-on-primary-container max-h-[60vh] overflow-auto p-2 leading-relaxed">
				{json}
			</pre>
		</div>
	);
}
