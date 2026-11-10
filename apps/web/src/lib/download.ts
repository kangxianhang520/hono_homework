/** 将数据序列化为 JSON 并触发浏览器下载（仅浏览器端调用）。 */
export function downloadJson(data: unknown, filename: string): void {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.style.display = "none";
	document.body.appendChild(a);
	try {
		a.click();
	} finally {
		a.remove();
		URL.revokeObjectURL(url);
	}
}

/** `github-profile-{login}-{YYYYMMDD}.json`；login 仅保留安全字符。 */
export function profileExportFilename(
	login: string,
	date = new Date(),
): string {
	const safe = login.replace(/[^A-Za-z0-9_-]/g, "_");
	const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
	return `github-profile-${safe}-${ymd}.json`;
}
