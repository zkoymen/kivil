type NeutralinoDraggableRegionOptions = {
  exclusions?: Array<string | HTMLElement>
}

type NeutralinoWindowApi = {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  unmaximize: () => Promise<void>
  isMaximized: () => Promise<boolean>
  setDraggableRegion: (
    domId: string | HTMLElement,
    options?: NeutralinoDraggableRegionOptions,
  ) => Promise<unknown>
  unsetDraggableRegion?: (domId: string | HTMLElement) => Promise<void>
}

type NeutralinoAppApi = {
  exit: (exitCode?: number) => Promise<void>
}

type NeutralinoApi = {
  init: () => void
  window: NeutralinoWindowApi
  app: NeutralinoAppApi
}

declare global {
  interface Window {
    Neutralino?: NeutralinoApi
  }
}

export {}
