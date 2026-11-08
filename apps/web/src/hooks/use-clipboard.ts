import { useCallback } from "react";

import { useToast } from "@/components/ui/toast";

/** Copy text to clipboard and report the result via toast. */
export function useClipboard() {
	const { showToast } = useToast();

	return useCallback(
		async (
			text: string,
			successMessage: string,
			type: "success" | "info" = "info",
		) => {
			try {
				await navigator.clipboard.writeText(text);
				showToast(successMessage, type);
			} catch {
				showToast("复制失败，请检查浏览器剪贴板权限", "info");
			}
		},
		[showToast],
	);
}
