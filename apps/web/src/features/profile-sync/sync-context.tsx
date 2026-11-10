import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useReducer,
	useRef,
} from "react";
import { useSessionStorage } from "@/hooks/use-session-storage";
import { ApiError, fetchGitHubSync } from "./api/github";
import type { GitHubSyncResponse } from "./api/types";

export type SyncStatus = "idle" | "loading" | "success" | "error";

export type SyncState = {
	status: SyncStatus;
	snapshot: GitHubSyncResponse | null;
	error: ApiError | null;
};

type SyncAction =
	| { type: "start" }
	| { type: "succeed"; snapshot: GitHubSyncResponse }
	| { type: "fail"; error: ApiError }
	| { type: "restore"; snapshot: GitHubSyncResponse }
	| { type: "reset" };

const initialState: SyncState = { status: "idle", snapshot: null, error: null };

function reducer(state: SyncState, action: SyncAction): SyncState {
	switch (action.type) {
		case "start":
			// 保留旧 snapshot，失败时仍可展示上次数据
			return { ...state, status: "loading", error: null };
		case "succeed":
		case "restore":
			return { status: "success", snapshot: action.snapshot, error: null };
		case "fail":
			return { ...state, status: "error", error: action.error };
		case "reset":
			return initialState;
	}
}

export const PAT_KEY = "ghsync:pat";
export const SNAPSHOT_KEY = "ghsync:snapshot";

export type SyncContextValue = SyncState & {
	token: string;
	setToken: (token: string) => void;
	/** sessionStorage 读取完成前为 false */
	hydrated: boolean;
	sync: () => Promise<void>;
	retry: () => Promise<void>;
	clear: () => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

const isAbortError = (e: unknown) =>
	e instanceof DOMException && e.name === "AbortError";

export function SyncProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(reducer, initialState);
	const [token, setStoredToken, removeToken, tokenHydrated] =
		useSessionStorage<string>(PAT_KEY, "");
	const [storedSnapshot, setStoredSnapshot, removeSnapshot, snapshotHydrated] =
		useSessionStorage<GitHubSyncResponse | null>(SNAPSHOT_KEY, null);

	const hydrated = tokenHydrated && snapshotHydrated;
	const controllerRef = useRef<AbortController | null>(null);
	const loadingRef = useRef(false);
	const tokenRef = useRef(token);
	tokenRef.current = token;

	// 刷新后从 snapshot 恢复
	const restoredRef = useRef(false);
	useEffect(() => {
		if (!snapshotHydrated || restoredRef.current) return;
		restoredRef.current = true;
		if (storedSnapshot) dispatch({ type: "restore", snapshot: storedSnapshot });
	}, [snapshotHydrated, storedSnapshot]);

	// 卸载时取消进行中的请求
	useEffect(() => () => controllerRef.current?.abort(), []);

	const sync = useCallback(async () => {
		if (loadingRef.current) return;
		const pat = tokenRef.current.trim();
		if (!pat) {
			dispatch({
				type: "fail",
				error: new ApiError("TOKEN_MISSING", "Token is empty"),
			});
			return;
		}
		const controller = new AbortController();
		controllerRef.current = controller;
		loadingRef.current = true;
		dispatch({ type: "start" });
		try {
			const snapshot = await fetchGitHubSync(pat, controller.signal);
			if (controller.signal.aborted) return;
			setStoredSnapshot(snapshot);
			dispatch({ type: "succeed", snapshot });
		} catch (e) {
			if (isAbortError(e) || controller.signal.aborted) return;
			dispatch({
				type: "fail",
				error:
					e instanceof ApiError
						? e
						: new ApiError("INTERNAL_ERROR", "Unexpected error"),
			});
		} finally {
			if (controllerRef.current === controller) {
				controllerRef.current = null;
				loadingRef.current = false;
			}
		}
	}, [setStoredSnapshot]);

	const clear = useCallback(() => {
		controllerRef.current?.abort();
		controllerRef.current = null;
		loadingRef.current = false;
		removeToken();
		removeSnapshot();
		dispatch({ type: "reset" });
	}, [removeToken, removeSnapshot]);

	const setToken = useCallback(
		(next: string) => setStoredToken(next),
		[setStoredToken],
	);

	const value = useMemo<SyncContextValue>(
		() => ({
			...state,
			token,
			setToken,
			hydrated,
			sync,
			retry: sync,
			clear,
		}),
		[state, token, setToken, hydrated, sync, clear],
	);

	return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useGitHubSync(): SyncContextValue {
	const ctx = useContext(SyncContext);
	if (!ctx) throw new Error("useGitHubSync must be used within SyncProvider");
	return ctx;
}
