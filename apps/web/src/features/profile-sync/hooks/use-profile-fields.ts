import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useSessionStorage } from "@/hooks/use-session-storage";

import type { GitHubUser } from "../api/types";
import type { FieldFilter, ProfileField } from "../data";
import {
	countFields,
	EMPTY_PERSISTED,
	filterFields,
	initialState,
	type PersistedFields,
	reducer,
	selectAllFields,
	selectHiddenCoreFields,
} from "../lib/fields-state";
import { FIELDS_KEY, useGitHubSync } from "../sync-context";

/** Duration of the row exit animation (ms) — matches FieldRow's transition */
export const ROW_EXIT_MS = 250;

export { FIELDS_KEY };

/** State + derived data for the field management table. */
export function useProfileFields(initialFilter: FieldFilter = "all") {
	const { snapshot, onClear } = useGitHubSync();
	const [state, dispatch] = useReducer(reducer, initialFilter, initialState);
	const [persisted, setPersisted, removePersisted, storageHydrated] =
		useSessionStorage<PersistedFields>(FIELDS_KEY, EMPTY_PERSISTED);

	// Track pending removal timers so they are cleared on unmount
	const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
	useEffect(() => {
		const pending = timers.current;
		return () => {
			for (const t of pending) clearTimeout(t);
		};
	}, []);

	// 1) 从 sessionStorage 恢复 custom / hiddenKeys（仅一次）
	const restoredRef = useRef(false);
	useEffect(() => {
		if (!storageHydrated || restoredRef.current) return;
		restoredRef.current = true;
		dispatch({
			type: "hydrate",
			persisted: {
				custom: Array.isArray(persisted?.custom) ? persisted.custom : [],
				hiddenKeys: Array.isArray(persisted?.hiddenKeys)
					? persisted.hiddenKeys
					: [],
			},
		});
	}, [storageHydrated, persisted]);

	// 2) 订阅 snapshot：有数据 -> syncCore 覆盖
	const fetchedAt = snapshot?.fetchedAt;
	// biome-ignore lint/correctness/useExhaustiveDependencies: 仅在 fetchedAt 变化时同步
	useEffect(() => {
		if (snapshot) dispatch({ type: "syncCore", user: snapshot.user });
	}, [fetchedAt]);

	// 2b) 清除缓存：直接挂到 SyncProvider 的 clear()(存储已由 clear 删除,这里重置内存 state)
	useEffect(
		() =>
			onClear(() => {
				dispatch({ type: "reset" });
				removePersisted();
			}),
		[onClear, removePersisted],
	);

	// 3) 持久化 custom / hiddenKeys（reducer 外的 effect；恢复完成后才写，避免覆盖）
	const { custom, hiddenKeys } = state;
	useEffect(() => {
		if (!restoredRef.current) return;
		if (custom.length === 0 && hiddenKeys.length === 0) {
			removePersisted();
			return;
		}
		setPersisted({ custom, hiddenKeys });
	}, [custom, hiddenKeys, setPersisted, removePersisted]);

	const allFields = useMemo(
		() => selectAllFields(state.core, custom, hiddenKeys),
		[state.core, hiddenKeys, custom],
	);

	const hiddenCoreFields = useMemo(
		() => selectHiddenCoreFields(state.core, hiddenKeys),
		[state.core, hiddenKeys],
	);

	const counts = useMemo(() => countFields(allFields), [allFields]);

	const visibleFields = useMemo(
		() => filterFields(allFields, state.filter, state.query),
		[allFields, state.filter, state.query],
	);

	/** 含已屏蔽核心字段，用于添加时 KEY 唯一校验 */
	const hasKey = useCallback(
		(key: string) => {
			const k = key.toLowerCase();
			return (
				state.core.some((f) => f.key.toLowerCase() === k) ||
				custom.some((f) => f.key.toLowerCase() === k)
			);
		},
		[state.core, custom],
	);

	const addField = useCallback(
		(field: ProfileField) => dispatch({ type: "add", field }),
		[],
	);

	const updateValue = useCallback(
		(key: string, value: string) => dispatch({ type: "update", key, value }),
		[],
	);

	/** Plays the exit animation, then removes the row. */
	const removeField = useCallback((key: string, onRemoved?: () => void) => {
		dispatch({ type: "markRemoving", key });
		const timer = setTimeout(() => {
			timers.current.delete(timer);
			dispatch({ type: "remove", key });
			onRemoved?.();
		}, ROW_EXIT_MS);
		timers.current.add(timer);
	}, []);

	const hideField = useCallback(
		(key: string) => dispatch({ type: "hide", key }),
		[],
	);
	const restoreField = useCallback(
		(key: string | "all") => dispatch({ type: "restore", key }),
		[],
	);
	const syncCore = useCallback(
		(user: GitHubUser) => dispatch({ type: "syncCore", user }),
		[],
	);
	const reset = useCallback(() => {
		dispatch({ type: "reset" });
		removePersisted();
	}, [removePersisted]);

	const setFilter = useCallback(
		(filter: FieldFilter) => dispatch({ type: "setFilter", filter }),
		[],
	);
	const setQuery = useCallback(
		(query: string) => dispatch({ type: "setQuery", query }),
		[],
	);

	return {
		...state,
		allFields,
		hiddenCoreFields,
		counts,
		visibleFields,
		hasKey,
		addField,
		updateValue,
		removeField,
		hideField,
		restoreField,
		syncCore,
		reset,
		setFilter,
		setQuery,
	};
}
