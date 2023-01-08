import { HttpProxy } from 'vite'
import { ensureDir, pathExists, outputFile } from 'fs-extra'
import { join } from 'path'
import prettier from 'prettier'

export type Options = {
  dataPath?: string;
  ext?: 'js' | 'json' | 'ts';
  override?: boolean;
}

const createOnProxyRes = (options: Options = {}) => {
  const { dataPath = 'data', ext = 'ts' } = options
  const basePath = join(process.cwd(), dataPath)

  return (proxyRes, req) => {
    const { method = '', url = '', override = false } = req
    const urlPath = url.replace(/^\//, '').replace(/\/$/, '')
    let [__, filedir = ''] = urlPath.match(/(.*)\/.*$/) || []
    let [_, filename] = url.match(/.*\/(.*)$/) || []
    let data: any[] = []
    console.log(urlPath, urlPath.match(/(.*)\/.*$/), urlPath.match(/.*\/(.*)$/))
  
    if (url === '/') {
      filedir = ''
      filename = '_'
    }
    filedir = join(basePath, filedir)
    filename = join(filedir, `${filename}.${method.toLowerCase()}.${ext}`)
  
    console.log('Sending Request to the Target:', req.method, req.url)
  
    proxyRes.on('data', (chunk) => {
      data.push(chunk)
    })
    proxyRes.on('end', async () => {
      const str = Buffer.concat(data).toString()
      const exist = await pathExists(filename)
      const resData = {
        url,
        method: method.toLowerCase(),
        response: JSON.parse(str),
      }
      let outputText = JSON.stringify(resData, null, 2)

      if (ext !== 'json') {
        outputText = prettier.format(`export default [${outputText}]`)
      }

      await ensureDir(filedir)
      if (override || !exist) {
        await outputFile(filename, outputText)
      }
    })
  }
}

export const viteProxyRes = (options?: Options) => {
  const onProxyRes = createOnProxyRes(options)

  return (proxy: HttpProxy.Server) => {
    proxy.on('proxyRes', onProxyRes)
  }
}

export const webpackProxyRes = (options: Options) => {
  return createOnProxyRes(options)
}