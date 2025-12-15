import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  // Cast external preset/config objects to any to avoid TS type incompatibilities
  // between eslint types and @typescript-eslint utils types in different package versions.
  (globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']) as unknown) as any,

  (pluginVue.configs['flat/essential'] as unknown) as any,
  (vueTsConfigs.recommended as unknown) as any,

  (({ ...pluginVitest.configs.recommended, files: ['src/**/__tests__/*'] }) as unknown) as any,

  (({ ...pluginPlaywright.configs['flat/recommended'], files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'] }) as unknown) as any,
  (skipFormatting as unknown) as any,
)
