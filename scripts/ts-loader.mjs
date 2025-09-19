import { access, readFile } from 'node:fs/promises'
import { dirname, extname, resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const tryResolveTs = async (specifier, parentURL) => {
  const parentPath = fileURLToPath(parentURL)
  const baseDir = extname(parentPath) ? dirname(parentPath) : parentPath
  const attempts = []

  if (!extname(specifier)) {
    attempts.push(
      `${specifier}.ts`,
      `${specifier}.tsx`,
      `${specifier}/index.ts`,
      `${specifier}/index.tsx`
    )
  } else {
    attempts.push(specifier)
  }

  for (const attempt of attempts) {
    const candidatePath = resolvePath(baseDir, attempt)
    try {
      await access(candidatePath)
      return pathToFileURL(candidatePath).href
    } catch {
      // try next option
    }
  }

  return undefined
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    const parentURL = context.parentURL ?? pathToFileURL(`${process.cwd()}/`).href
    const resolvedTs = await tryResolveTs(specifier, parentURL)

    if (resolvedTs) {
      return { url: resolvedTs, shortCircuit: true }
    }
  }

  return defaultResolve(specifier, context, defaultResolve)
}

const compilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2020,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  resolveJsonModule: true,
  allowSyntheticDefaultImports: true
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith('.ts') || url.endsWith('.tsx')) {
    const source = await readFile(fileURLToPath(url), 'utf8')
    const { outputText } = ts.transpileModule(source, {
      compilerOptions,
      fileName: fileURLToPath(url)
    })

    return {
      format: 'module',
      source: outputText,
      shortCircuit: true
    }
  }

  return defaultLoad(url, context, defaultLoad)
}
