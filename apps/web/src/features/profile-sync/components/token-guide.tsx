import { IconButton } from "@/components/ui/button";
import { Collapse } from "@/components/ui/collapse";
import { Lightbulb, X } from "@/components/ui/design-icons";

type TokenGuideProps = {
	open: boolean;
	onClose: () => void;
};

function Scope({ children }: { children: string }) {
	return (
		<code className="code-chip bg-surface-container-highest text-secondary font-medium">
			{children}
		</code>
	);
}

/** Collapsible help banner explaining how to create a PAT. */
export function TokenGuide({ open, onClose }: TokenGuideProps) {
	return (
		// Negative margin cancels the parent's gap while collapsed
		<Collapse
			open={open}
			id="token-guide"
			className={open ? "" : "-mt-space-lg"}
		>
			<div className="bg-surface-container-low p-space-md rounded-lg shadow-sm">
				<div className="gap-space-md flex items-start">
					<Lightbulb className="text-secondary mt-0.5 size-[22px] shrink-0" />
					<div className="flex-1 space-y-1.5">
						<p className="text-label-md text-on-surface font-mono font-semibold">
							快速指引：在 GitHub 生成高安全性 PAT
						</p>
						<p className="text-body-sm text-on-surface-variant leading-6">
							访问 GitHub Settings &gt; Developer settings &gt; Personal access
							tokens &gt; Tokens (classic)。点击 Generate new token，勾选{" "}
							<Scope>read:user</Scope>（读取用户资料）及{" "}
							<Scope>user:email</Scope>（读取隐私邮箱）。建议设置有效期不超过 90
							天，保证凭证生命周期安全。
						</p>
					</div>
					<IconButton label="关闭指引" onClick={onClose} className="p-1">
						<X className="size-[18px]" />
					</IconButton>
				</div>
			</div>
		</Collapse>
	);
}
