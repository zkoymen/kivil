import { window as neutralinoWindow } from '@neutralinojs/lib'

const compactSize = {
  width: 420,
  height: 300,
}

const normalMinimumSize = {
  minWidth: 1180,
  minHeight: 760,
}

export type WindowRestoreState = {
  width: number
  height: number
  x: number
  y: number
} | null

const isNeutralinoRuntime = () =>
  typeof window.NL_PORT === 'number' && typeof window.NL_TOKEN === 'string'

const getCompactPosition = () => {
  const margin = 22
  const screenWidth = window.screen?.availWidth || 1366
  const screenHeight = window.screen?.availHeight || 768

  return {
    x: Math.max(screenWidth - compactSize.width - margin, margin),
    y: Math.max(screenHeight - compactSize.height - margin, margin),
  }
}

export const enterCompactWindowMode = async (): Promise<WindowRestoreState> => {
  if (!isNeutralinoRuntime()) {
    return null
  }

  try {
    const [size, position] = await Promise.all([
      neutralinoWindow.getSize(),
      neutralinoWindow.getPosition(),
    ])
    const compactPosition = getCompactPosition()

    await neutralinoWindow.setAlwaysOnTop(true)
    await neutralinoWindow.setSize({
      ...compactSize,
      minWidth: compactSize.width,
      minHeight: compactSize.height,
      resizable: false,
    })
    await neutralinoWindow.move(compactPosition.x, compactPosition.y)
    await neutralinoWindow.focus()

    return {
      width: size.width ?? normalMinimumSize.minWidth,
      height: size.height ?? normalMinimumSize.minHeight,
      x: position.x ?? compactPosition.x,
      y: position.y ?? compactPosition.y,
    }
  } catch {
    return null
  }
}

export const exitCompactWindowMode = async (restoreState: WindowRestoreState) => {
  if (!isNeutralinoRuntime()) {
    return
  }

  try {
    await neutralinoWindow.setAlwaysOnTop(false)
    await neutralinoWindow.setSize({
      width: restoreState?.width ?? 1780,
      height: restoreState?.height ?? 1200,
      ...normalMinimumSize,
      resizable: true,
    })

    if (restoreState) {
      await neutralinoWindow.move(restoreState.x, restoreState.y)
    } else {
      await neutralinoWindow.center()
    }

    await neutralinoWindow.focus()
  } catch {
    return
  }
}
