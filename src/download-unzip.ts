import * as request from 'request'
import * as tar from 'tar'

export async function downloadAndUnzip(
  url: string,
  dirPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // const out = fs.createWriteStream(dirPath)
    // resolve()
    const _ = request
      .get(url)
      .pipe(tar.x({ cwd: dirPath, strip: 1 }))
      .on('finish', resolve)
      .on('error', reject)
  })
}
