import { resolve } from 'path'
import { UserConfigExport, ConfigEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteMockServe } from 'vite-plugin-mock'
import { viteProxyRes } from './generate-mock-data-utils'

export default ({ command }: ConfigEnv): UserConfigExport => {
  return {
    build: {
      target: 'node12',
      lib: {
        entry: resolve(process.cwd(), './generate-mock-data-utils.ts'),
        name: 'generateMockDataUtils',
        fileName: 'generate-mock-data-utils',
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        // 确保外部化处理那些你不想打包进库的依赖
        external: [
          'path',
          'fs-extra',
          'prettier'
        ],
      },
    },
    plugins: [
      react(),
      viteMockServe({
        // default
        mockPath: 'mock',
        localEnabled: command === 'serve',
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5173/',
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: viteProxyRes({ ext: 'json' })
        },
      }
    }
  }
}
