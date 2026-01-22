import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
    // ignore build output
    { ignores: ["dist", "build", "coverage"] },

    js.configs.recommended,
    ...tseslint.configs.recommended, // TS rules without typed linting

    {
        files: ["**/*.{ts,tsx}"],
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules, // Rules of Hooks + deps checks
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        },
    },
];
