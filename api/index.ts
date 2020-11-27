import { NowRequest, NowResponse, NowApiHandler } from '@vercel/node'
import { proxy } from '../src'

async function handler(req: NowRequest, res: NowResponse) {
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

const allowCors = (fn: NowApiHandler): NowApiHandler => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return fn(req, res)
}

export default allowCors(handler)
