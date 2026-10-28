import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import decode, { init } from '@jsquash/webp/decode.js'
import { PNG } from 'pngjs'
import superagent from 'superagent'
import type { CommonPost } from '../type'

let decoderReady: Promise<unknown> | undefined

function loadWasm() {
  const candidates = [
    path.join(path.dirname(process.argv[1] || ''), 'webp_dec.wasm'),
    path.join(process.cwd(), 'src/util/webp_dec.wasm'),
  ]
  const wasmPath = candidates.find(candidate => fs.existsSync(candidate))
  if (!wasmPath)
    throw new Error(`找不到 webp 解码器：${candidates.join(', ')}`)
  return fs.readFileSync(wasmPath)
}

function ensureDecoder() {
  if (!decoderReady)
    decoderReady = init({ wasmBinary: loadWasm() })
  return decoderReady
}

const CARD_WIDTH = 640
const CARD_HEIGHT = 360
const CARD_RADIUS = 16

interface RgbaImage {
  width: number
  height: number
  data: Uint8ClampedArray
}

function parseBinary(response: NodeJS.ReadableStream, callback: (error: Error | null, body?: Buffer) => void) {
  const chunks: Buffer[] = []
  response.on('data', (chunk: Buffer) => {
    chunks.push(Buffer.from(chunk))
  })
  response.on('end', () => {
    callback(null, Buffer.concat(chunks))
  })
  response.on('error', (error: Error) => {
    callback(error)
  })
}

async function download(url: string) {
  const res = await superagent.get(url).buffer(true).parse(parseBinary)
  return res.body as Buffer
}

function coverCrop(source: RgbaImage, targetWidth: number, targetHeight: number) {
  const scale = Math.max(targetWidth / source.width, targetHeight / source.height)
  const cropWidth = targetWidth / scale
  const cropHeight = targetHeight / scale
  const offsetX = (source.width - cropWidth) / 2
  const offsetY = (source.height - cropHeight) / 2
  const output = new Uint8Array(targetWidth * targetHeight * 4)

  for (let y = 0; y < targetHeight; y++) {
    const sourceY = offsetY + (y + 0.5) / scale - 0.5
    const y0 = Math.max(0, Math.min(source.height - 1, Math.floor(sourceY)))
    const y1 = Math.max(0, Math.min(source.height - 1, y0 + 1))
    const fy = Math.min(1, Math.max(0, sourceY - y0))

    for (let x = 0; x < targetWidth; x++) {
      const sourceX = offsetX + (x + 0.5) / scale - 0.5
      const x0 = Math.max(0, Math.min(source.width - 1, Math.floor(sourceX)))
      const x1 = Math.max(0, Math.min(source.width - 1, x0 + 1))
      const fx = Math.min(1, Math.max(0, sourceX - x0))
      const index = (y * targetWidth + x) * 4

      for (let channel = 0; channel < 4; channel++) {
        const topLeft = source.data[(y0 * source.width + x0) * 4 + channel]
        const topRight = source.data[(y0 * source.width + x1) * 4 + channel]
        const bottomLeft = source.data[(y1 * source.width + x0) * 4 + channel]
        const bottomRight = source.data[(y1 * source.width + x1) * 4 + channel]
        const value = topLeft * (1 - fx) * (1 - fy)
          + topRight * fx * (1 - fy)
          + bottomLeft * (1 - fx) * fy
          + bottomRight * fx * fy
        output[index + channel] = Math.round(value)
      }
    }
  }

  return output
}

function roundCorners(pixels: Uint8Array, width: number, height: number, radius: number) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x < radius
        ? radius - x - 0.5
        : x >= width - radius
          ? x - (width - radius) + 0.5
          : 0
      const dy = y < radius
        ? radius - y - 0.5
        : y >= height - radius
          ? y - (height - radius) + 0.5
          : 0
      if (dx <= 0 || dy <= 0)
        continue

      const distance = Math.hypot(dx, dy)
      const alphaIndex = (y * width + x) * 4 + 3
      if (distance >= radius + 0.5)
        pixels[alphaIndex] = 0
      else if (distance > radius - 0.5)
        pixels[alphaIndex] = Math.round(pixels[alphaIndex] * Math.min(1, Math.max(0, radius + 0.5 - distance)))
    }
  }
}

async function renderCover(url: string) {
  await ensureDecoder()
  const downloaded = await download(url)
  const bytes = downloaded.buffer.slice(downloaded.byteOffset, downloaded.byteOffset + downloaded.byteLength)
  const decoded = await decode(bytes) as RgbaImage
  const pixels = coverCrop(decoded, CARD_WIDTH, CARD_HEIGHT)
  roundCorners(pixels, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS)
  const png = new PNG({ width: CARD_WIDTH, height: CARD_HEIGHT })
  png.data.set(pixels)
  return PNG.sync.write(png)
}

function coverFileName(link: string) {
  return `${createHash('sha1').update(link).digest('hex').slice(0, 16)}.png`
}

export async function materializeCovers(
  posts: CommonPost[],
  directory: string,
  onError?: (post: CommonPost, error: unknown) => void,
) {
  fs.mkdirSync(directory, { recursive: true })
  const saved = new Map<string, string>()

  await Promise.all(posts.map(async (post) => {
    if (!post.cover)
      return

    try {
      const fileName = coverFileName(post.link)
      const png = await renderCover(post.cover)
      fs.writeFileSync(path.join(directory, fileName), png)
      saved.set(post.link, fileName)
    }
    catch (error) {
      onError?.(post, error)
    }
  }))

  for (const fileName of fs.readdirSync(directory)) {
    if (fileName.endsWith('.png') && ![...saved.values()].includes(fileName))
      fs.unlinkSync(path.join(directory, fileName))
  }

  return saved
}

export const coverSize = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
}
