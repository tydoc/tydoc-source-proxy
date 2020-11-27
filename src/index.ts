// process.env['DEBUG'] = 'tydoc:*'

import { NowRequest, NowResponse } from '@vercel/node'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as request from 'request'
import { downloadAndUnzip } from './download-unzip'
import * as TyDoc from 'tydoc'

export default async function (req: NowRequest, res: NowResponse) {
  const { github, entrypoint } = req.query as {
    github: string
    entrypoint: string
  }

  if (!github) {
    res.status(400).send(`No query param "github=[string]" provided`)
    return
  }

  if (!entrypoint) {
    res.status(400).send(`No query param "entrypoint=[string]" provided`)
    return
  }
  const [, owner, name] = github.match(/^https:\/\/github\.com\/(.+?)\/(.+?)$/)!
  const { default_branch: defaultBranch } = await getJson<{
    default_branch: string
  }>(`https://api.github.com/repos/${owner}/${name}`)

  const dir = await fs.mkdtemp(
    path.join(os.tmpdir(), `tydoc-source-proxy-${owner}-${name}-`),
  )

  try {
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

    res.send(JSON.stringify(docs))
  } catch (e) {
    console.error(e)
    res.status(500).send(`Error occured: ${e}`)
  }
}

async function getJson<T>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.get(
      { url, json: true, headers: { 'user-agent': 'node.js' } },
      (err, _, data) => (err ? reject(err) : resolve(data)),
    )
  })
}
