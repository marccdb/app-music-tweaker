import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePracticeStore } from './practice'
import type { LibrarySnapshot } from '../types/practice'

let mockLibrarySnapshot: LibrarySnapshot | undefined

vi.mock('../lib/audioEngine', () => {
  class MockAudioEngine {
    on() {
      return () => {}
    }
    async loadFile() {
      return 0
    }
    async play() {}
    pause() {}
    seek() {}
    setTempo(value: number) {
      return value
    }
    setPitch(value: number) {
      return value
    }
    setVolume(value: number) {
      return value
    }
    setLoop() {}
    getDuration() {
      return 0
    }
  }

  return { AudioEngine: MockAudioEngine }
})

vi.mock('../lib/projectRepository', () => {
  class MockProjectRepository {
    async get() {
      return undefined
    }
    async list() {
      return []
    }
    async save() {}
    async delete() {}
  }
  return { IndexedDbProjectRepository: MockProjectRepository }
})

vi.mock('../lib/folderLibraryRepository', () => {
  class MockFolderLibraryRepository {
    async getSnapshot() {
      return mockLibrarySnapshot
    }
    async saveSnapshot() {}
    async clearSnapshot() {}
  }
  return { IndexedDbFolderLibraryRepository: MockFolderLibraryRepository }
})

type PermissionStateLike = 'granted' | 'prompt' | 'denied'

type MockDirectoryHandle = {
  name: string
  values: ReturnType<typeof vi.fn>
  queryPermission?: ReturnType<typeof vi.fn>
  requestPermission?: ReturnType<typeof vi.fn>
}

function createAudioDirectoryHandle(permission: {
  query: PermissionStateLike
  request?: PermissionStateLike
}) {
  const file = new File(['audio-data'], 'song.mp3', { type: 'audio/mpeg' })
  const fileEntry = {
    kind: 'file',
    name: 'song.mp3',
    getFile: vi.fn(async () => file),
  }

  const values = vi.fn(async function* () {
    yield fileEntry
  })

  const handle: MockDirectoryHandle = {
    name: 'Practice',
    values,
    queryPermission: vi.fn(async () => permission.query),
  }

  if (permission.request) {
    handle.requestPermission = vi.fn(async () => permission.request as PermissionState)
  }

  return {
    handle: handle as unknown as FileSystemDirectoryHandle,
    valuesSpy: values,
    queryPermissionSpy: handle.queryPermission,
    requestPermissionSpy: handle.requestPermission,
  }
}

describe('practice store refreshFolderScan permission flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockLibrarySnapshot = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    delete (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker
    mockLibrarySnapshot = undefined
  })

  it('queryPermission=granted scans and keeps folderConnected=true', async () => {
    const { handle, valuesSpy, queryPermissionSpy, requestPermissionSpy } = createAudioDirectoryHandle({
      query: 'granted',
    })
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: vi.fn(async () => handle),
    })

    const store = usePracticeStore()
    await store.importFolder()
    valuesSpy.mockClear()

    await store.refreshFolderScan()

    expect(queryPermissionSpy).toHaveBeenCalledWith({ mode: 'read' })
    expect(requestPermissionSpy).toBeUndefined()
    expect(valuesSpy).toHaveBeenCalledTimes(1)
    expect(store.folderConnected).toBe(true)
    expect(store.scanError).toBe('')
    expect(store.tracks.length).toBe(1)
  })

  it('queryPermission=prompt and requestPermission=granted scans', async () => {
    const { handle, valuesSpy, queryPermissionSpy, requestPermissionSpy } = createAudioDirectoryHandle({
      query: 'prompt',
      request: 'granted',
    })
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: vi.fn(async () => handle),
    })

    const store = usePracticeStore()
    await store.importFolder()
    valuesSpy.mockClear()

    await store.refreshFolderScan()

    expect(queryPermissionSpy).toHaveBeenCalledWith({ mode: 'read' })
    expect(requestPermissionSpy).toHaveBeenCalledWith({ mode: 'read' })
    expect(valuesSpy).toHaveBeenCalledTimes(1)
    expect(store.folderConnected).toBe(true)
    expect(store.scanError).toBe('')
  })

  it.each([
    { query: 'prompt' as const, request: 'denied' as const },
    { query: 'denied' as const, request: 'prompt' as const },
  ])(
    'queryPermission=$query and requestPermission=$request sets error, folderConnected=false, no scan',
    async ({ query, request }) => {
      const { handle, valuesSpy, queryPermissionSpy, requestPermissionSpy } = createAudioDirectoryHandle({
        query,
        request,
      })
      Object.defineProperty(window, 'showDirectoryPicker', {
        configurable: true,
        value: vi.fn(async () => handle),
      })

      const store = usePracticeStore()
      await store.importFolder()
      valuesSpy.mockClear()
      store.scanError = ''
      store.folderConnected = true

      await store.refreshFolderScan()

      expect(queryPermissionSpy).toHaveBeenCalledWith({ mode: 'read' })
      expect(requestPermissionSpy).toHaveBeenCalledWith({ mode: 'read' })
      expect(valuesSpy).not.toHaveBeenCalled()
      expect(store.scanError).toBe('Folder permission missing. Reconnect with Import Folder.')
      expect(store.folderConnected).toBe(false)
    },
  )

  it('no folderHandle returns early error', async () => {
    const store = usePracticeStore()

    await store.refreshFolderScan()

    expect(store.scanError).toBe('No connected folder handle. Re-import folder.')
    expect(store.folderConnected).toBe(false)
    expect(store.isScanning).toBe(false)
  })

  it('restoreLastFolder checks permission without prompting', async () => {
    const { handle, queryPermissionSpy, requestPermissionSpy } = createAudioDirectoryHandle({
      query: 'denied',
      request: 'granted',
    })

    mockLibrarySnapshot = {
      folderName: 'Practice',
      tracks: [
        {
          id: 'song.mp3:1:1',
          name: 'song.mp3',
          relativePath: 'song.mp3',
          fingerprint: 'song.mp3',
          lastModified: 1,
          size: 1,
          sourceType: 'directory-handle',
        },
      ],
      activeTrackId: null,
      sourceType: 'directory-handle',
      directoryHandle: handle,
      updatedAt: new Date(0).toISOString(),
    }

    const store = usePracticeStore()
    await store.restoreLastFolder()

    expect(queryPermissionSpy).toHaveBeenCalledWith({ mode: 'read' })
    expect(requestPermissionSpy).toHaveBeenCalledTimes(0)
    expect(store.folderConnected).toBe(false)
    expect(store.scanError).toBe('Folder permission missing. Reconnect with Import Folder.')
  })
})
