import { createCn } from "cn/config";

/**
 * Class merger aware of the design-system tokens in `styles/theme.css`.
 * Without this, `text-label-sm` (a font size) would be treated as a text
 * color and dropped when combined with e.g. `text-tertiary`.
 */
export const cn = createCn({
	extend: {
		classGroups: {
			"font-size": [
				{
					text: [
						"headline-xl",
						"headline-lg",
						"headline-md",
						"headline-sm",
						"body-lg",
						"body-md",
						"body-sm",
						"label-lg",
						"label-md",
						"label-sm",
						"code-inline",
					],
				},
			],
		},
		theme: {
			spacing: [
				"space-xs",
				"space-sm",
				"space-md",
				"space-lg",
				"space-xl",
				"gutter",
				"gutter-desktop",
				"margin",
				"margin-tablet",
				"margin-desktop",
			],
		},
	},
});
