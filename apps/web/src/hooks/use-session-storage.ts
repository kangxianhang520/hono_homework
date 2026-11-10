import { useCallback, useEffect, useRef, useState } from "react";

// sessionStorage 不可用(隐私模式/配额/禁用)时的内存降级存储,按 key 保存序列化后的字符串
const memoryStore = new Map<string, string>();

function readRaw(key: string): string | null {
	// 写入 sessionStorage 失败时最新值只在内存里,必须优先读内存
	const fromMemory = memoryStore.get(key);
	if (fromMemory !== undefined) return fromMemory;
	try {
		if (typeof window !== "undefined") {
			return window.sessionStorage.getItem(key);
		}
	} catch {
		// 降级到内存
	}
	return memoryStore.get(key) ?? null;
}

function writeRaw(key: string, raw: string) {
	try {
		if (typeof window !== "undefined") {
			window.sessionStorage.setItem(key, raw);
			memoryStore.delete(key);
			return;
		}
	} catch {
		// 降级到内存
	}
	memoryStore.set(key, raw);
}

/** 直接删除某个 key(含内存降级项),供不持有该 hook 实例的模块清理关联数据 */
export function removeSessionStorageItem(key: string) {
	removeRaw(key);
}

function removeRaw(key: string) {
	memoryStore.delete(key);
	try {
		if (typeof window !== "undefined") {
			window.sessionStorage.removeItem(key);
		}
	} catch {
		// 忽略
	}
}

function parse<T>(raw: string | null, fallback: T): T {
	if (raw === null) return fallback;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

/**
 * 会话级持久化 state。
 * - 首渲染(含 SSR)返回 `initial`,避免 hydration 不一致;挂载后在 useEffect 中读取。
 * - 读写均 try/catch,sessionStorage 不可用时降级为内存。
 * - 返回 `hydrated`,读取完成前为 false,可用于显示骨架。
 */
export function useSessionStorage<T>(key: string, initial: T) {
	const [value, setValue] = useState<T>(initial);
	const [hydrated, setHydrated] = useState(false);
	const initialRef = useRef(initial);
	const valueRef = useRef(value);
	valueRef.current = value;

	useEffect(() => {
		const next = parse<T>(readRaw(key), initialRef.current);
		valueRef.current = next;
		setValue(next);
		setHydrated(true);
	}, [key]);

	const set = useCallback(
		(next: T | ((prev: T) => T)) => {
			const resolved =
				typeof next === "function"
					? (next as (prev: T) => T)(valueRef.current)
					: next;
			valueRef.current = resolved;
			setValue(resolved);
			try {
				writeRaw(key, JSON.stringify(resolved));
			} catch {
				// 序列化失败:仅保留 state
			}
		},
		[key],
	);

	const remove = useCallback(() => {
		removeRaw(key);
		valueRef.current = initialRef.current;
		setValue(initialRef.current);
	}, [key]);

	return [value, set, remove, hydrated] as const;
}
