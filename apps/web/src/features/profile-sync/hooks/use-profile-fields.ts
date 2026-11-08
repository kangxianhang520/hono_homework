import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import type { FieldCategory, FieldFilter, ProfileField } from "../data";

/** Duration of the row exit animation (ms) — matches FieldRow's transition */
export const ROW_EXIT_MS = 250;

type State = {
	fields: ProfileField[];
	/** keys currently playing the exit animation */
	removing: string[];
	filter: FieldFilter;
	query: string;
};

type Action =
	| { type: "add"; field: ProfileField }
	| { type: "update"; key: string; value: string }
	| { type: "markRemoving"; key: string }
	| { type: "remove"; key: string }
	| { type: "setFilter"; filter: FieldFilter }
	| { type: "setQuery"; query: string };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "add":
			return { ...state, fields: [...state.fields, action.field] };
		case "update":
			return {
				...state,
				fields: state.fields.map((f) =>
					f.key === action.key ? { ...f, value: action.value } : f,
				),
			};
		case "markRemoving":
			return { ...state, removing: [...state.removing, action.key] };
		case "remove":
			return {
				...state,
				fields: state.fields.filter((f) => f.key !== action.key),
				removing: state.removing.filter((k) => k !== action.key),
			};
		case "setFilter":
			return { ...state, filter: action.filter };
		case "setQuery":
			return { ...state, query: action.query };
	}
}

/** State + derived data for the field management table. */
export function useProfileFields(
	initialFields: ProfileField[],
	initialFilter: FieldFilter = "all",
) {
	const [state, dispatch] = useReducer(reducer, {
		fields: initialFields,
		removing: [],
		filter: initialFilter,
		query: "",
	});

	// Track pending removal timers so they are cleared on unmount
	const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
	useEffect(() => {
		const pending = timers.current;
		return () => {
			for (const t of pending) clearTimeout(t);
		};
	}, []);

	const counts = useMemo(() => {
		const result: Record<FieldFilter, number> = {
			all: 0,
			core: 0,
			custom: 0,
			sensitive: 0,
		};
		for (const field of state.fields) {
			result.all++;
			result[field.category]++;
		}
		return result;
	}, [state.fields]);

	const visibleFields = useMemo(() => {
		const q = state.query.trim().toLowerCase();
		return state.fields.filter((field) => {
			const matchCategory =
				state.filter === "all" || field.category === state.filter;
			const matchQuery =
				!q ||
				field.key.toLowerCase().includes(q) ||
				field.label.toLowerCase().includes(q);
			return matchCategory && matchQuery;
		});
	}, [state.fields, state.filter, state.query]);

	const hasKey = useCallback(
		(key: string) =>
			state.fields.some((f) => f.key.toLowerCase() === key.toLowerCase()),
		[state.fields],
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
		counts,
		visibleFields,
		hasKey,
		addField,
		updateValue,
		removeField,
		setFilter,
		setQuery,
	};
}

export function categoryForType(type: ProfileField["type"]): FieldCategory {
	return type === "secret" ? "sensitive" : "custom";
}
