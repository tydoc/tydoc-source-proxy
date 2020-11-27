import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as request from 'request'
import { downloadAndUnzip } from './download-unzip'
// process.env['DEBUG'] = 'tydoc:*'
import * as TyDoc from 'tydoc'

export async function proxy({
  github,
  entrypoint,
}: {
  github: string
  entrypoint: string
}): Promise<string> {
  const [, owner, name] = github.match(/^https:\/\/github\.com\/(.+?)\/(.+?)$/)!
  const { default_branch: defaultBranch } = await getJson<{
    default_branch: string
  }>(`https://api.github.com/repos/${owner}/${name}`)

  const dir = await fs.mkdtemp(
    path.join(os.tmpdir(), `tydoc-source-proxy-${owner}-${name}-`),
  )

  await downloadAndUnzip(
    `https://github.com/${owner}/${name}/tarball/${defaultBranch}`,
    dir,
  )

  const docs = TyDoc.fromProject({
    entrypoints: [entrypoint],
    readSettingsFromJSON: true,
    haltOnDiagnostics: false,
    prjDir: dir,
  })

  return JSON.stringify(docs)
}

async function getJson<T>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.get(
      { url, json: true, headers: { 'user-agent': 'node.js' } },
      (err, _, data) => (err ? reject(err) : resolve(data)),
    )
  })
}
