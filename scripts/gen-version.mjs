#!/usr/bin/env node
// Gera public/version.json com a versão do package.json + git sha.
// Rodado pelo `build` antes do `vite build`; o Vite copia public/ → dist/client/.
// GIT_SHA vem do env no CI (github.sha); fallback para o git local.
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

let gitSha = process.env.GIT_SHA ?? ''
if (!gitSha) {
  try {
    gitSha = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim()
  } catch {
    gitSha = 'unknown'
  }
}

const payload = { version: pkg.version, gitSha: gitSha.slice(0, 7) }
const publicDir = resolve(root, 'public')
mkdirSync(publicDir, { recursive: true })
writeFileSync(resolve(publicDir, 'version.json'), `${JSON.stringify(payload, null, 2)}\n`)
console.log(`version.json → ${JSON.stringify(payload)}`)
