type NeutralinoWindowApi = {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  unmaximize: () => Promise<void>
  isMaximized: () => Promise<boolean>
  setDraggableRegion: (
    domId: string | HTMLElement,
    options?: {
      exclusions?: Array<string | HTMLElement>
    },
  ) => Promise<unknown>
}

type NeutralinoAppApi = {
  exit: (exitCode?: number) => Promise<void>
}

type NeutralinoApi = {
  init: () => void
  app: NeutralinoAppApi
  window: NeutralinoWindowApi
}

declare global {
  interface Window {
    Neutralino?: NeutralinoApi
  }
}

export {}
