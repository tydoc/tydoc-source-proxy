import { NowRequest, NowResponse } from '@vercel/node'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as request from 'request'
import { downloadAndUnzip } from './download-unzip'

export default async function (req: NowRequest, res: NowResponse) {
  const { github } = req.query as { github: string }

  if (!github) {
    res.status(400).send(`No query param "?github" provided`)
    return
  }
  const [, owner, name] = github.match(/^https:\/\/github\.com\/(.+?)\/(.+?)$/)!
  const { default_branch: defaultBranch } = await getJson<{
    default_branch: string
  }>(`https://api.github.com/repos/${owner}/${name}`)

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tydoc-source-proxy-'))

  await downloadAndUnzip(
    `https://github.com/${owner}/${name}/tarball/${defaultBranch}`,
    dir,
  )
  const files = await fs.readdir(dir)

  res.send(JSON.stringify(files))
}

async function getJson<T>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.get(url, { json: true }, (err, _, data) =>
      err ? reject(err) : resolve(data),
    )
  })
}
