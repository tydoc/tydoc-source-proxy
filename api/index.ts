import { NowRequest, NowResponse } from '@vercel/node'
import { proxy } from '../src'

export default async function (req: NowRequest, res: NowResponse) {
  const { github, entrypoint } = req.query as {
    github: string
    entrypoint: string
  }
  if (!github) {
    res.status(400).send(`No query param "github=[string]" provided`)
  }

  if (!entrypoint) {
    res.status(400).send(`No query param "entrypoint=[string]" provided`)
  }

  try {
    const data = await proxy({ github, entrypoint })
    res.send(data)
  } catch (e) {
    console.error(e)
    throw new Error(`Error occured: ${e}`)
  }
}
