import { makeFingerprint } from './math'
import type { FolderTrack, LibrarySourceType } from '../types/practice'

const MEDIA_EXTENSIONS = new Set([
  '.aac',
  '.aif',
  '.aiff',
  '.flac',
  '.m4a',
  '.m4b',
  '.m4v',
  '.mkv',
  '.mov',
  '.mp3',
  '.mp4',
  '.oga',
  '.ogg',
  '.opus',
  '.wav',
  '.weba',
  '.webm',
  '.wma',
])

export function normalizeRelativePath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\/+/, '')
}

export function getLowerExtension(name: string): string {
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex < 0) return ''
  return name.slice(dotIndex).toLowerCase()
}

export function isSupportedMediaFile(file: Pick<File, 'type' | 'name'>): boolean {
  if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
    return true
  }
  return MEDIA_EXTENSIONS.has(getLowerExtension(file.name))
}

export function sortTracksByPath(tracks: FolderTrack[]): FolderTrack[] {
  return tracks.slice().sort((a, b) => a.relativePath.localeCompare(b.relativePath, undefined, { sensitivity: 'base' }))
}

export function createFolderTrack(file: File, relativePath: string, sourceType: LibrarySourceType): FolderTrack {
  const normalizedPath = normalizeRelativePath(relativePath || file.name)
  return {
    id: makeFingerprint(file),
    name: file.name,
    relativePath: normalizedPath,
    fingerprint: makeFingerprint(file),
    lastModified: file.lastModified,
    size: file.size,
    sourceType,
  }
}

export function createTrackIndexId(relativePath: string, lastModified: number, size: number): string {
  return `${normalizeRelativePath(relativePath)}:${lastModified}:${size}`
}

export function getRelativePathFromInputFile(file: File): string {
  const withRelativePath = file as File & { webkitRelativePath?: string }
  return normalizeRelativePath(withRelativePath.webkitRelativePath || file.name)
}

