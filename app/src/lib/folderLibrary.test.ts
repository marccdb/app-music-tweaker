import { describe, expect, it } from 'vitest'
import {
  createTrackIndexId,
  getRelativePathFromInputFile,
  isSupportedMediaFile,
  normalizeRelativePath,
  sortTracksByPath,
} from './folderLibrary'
import type { FolderTrack } from '../types/practice'

function makeTrack(relativePath: string): FolderTrack {
  return {
    id: relativePath,
    name: relativePath.split('/').at(-1) ?? relativePath,
    relativePath,
    fingerprint: relativePath,
    lastModified: 1,
    size: 1,
    sourceType: 'webkitdirectory',
  }
}

describe('isSupportedMediaFile', () => {
  it('accepts audio/video mime types', () => {
    expect(isSupportedMediaFile({ type: 'audio/mpeg', name: 'song.bin' })).toBe(true)
    expect(isSupportedMediaFile({ type: 'video/mp4', name: 'clip.bin' })).toBe(true)
  })

  it('accepts known extensions when mime missing', () => {
    expect(isSupportedMediaFile({ type: '', name: 'song.FLAC' })).toBe(true)
    expect(isSupportedMediaFile({ type: '', name: 'set.mov' })).toBe(true)
  })

  it('rejects unsupported files', () => {
    expect(isSupportedMediaFile({ type: '', name: 'cover.jpg' })).toBe(false)
  })
})

describe('folder path helpers', () => {
  it('normalizes separators and leading slash', () => {
    expect(normalizeRelativePath('\\Band\\Take 1.wav')).toBe('Band/Take 1.wav')
    expect(normalizeRelativePath('/Band/Take 1.wav')).toBe('Band/Take 1.wav')
  })

  it('keeps deterministic fallback id', () => {
    expect(createTrackIndexId('Band/Take 1.wav', 10, 500)).toBe('Band/Take 1.wav:10:500')
  })

  it('reads relative path from webkitdirectory files', () => {
    const file = new File(['x'], 'Take 1.wav') as File & { webkitRelativePath?: string }
    file.webkitRelativePath = 'Band/Take 1.wav'
    expect(getRelativePathFromInputFile(file)).toBe('Band/Take 1.wav')
  })
})

describe('sortTracksByPath', () => {
  it('sorts by relative path case-insensitive', () => {
    const sorted = sortTracksByPath([makeTrack('z/set.wav'), makeTrack('A/take.wav'), makeTrack('b/take.wav')])
    expect(sorted.map((track) => track.relativePath)).toEqual(['A/take.wav', 'b/take.wav', 'z/set.wav'])
  })
})

