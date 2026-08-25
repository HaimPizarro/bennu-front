import { useState } from 'react'
import { getSettings, saveSettings } from '../lib/api.js'

const EMPTY_HOURS = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
}

const DEFAULT_HOURS = {
  1: [
    { start: '10:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ],
  2: [
    { start: '10:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ],
  3: [
    { start: '10:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ],
  4: [
    { start: '10:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ],
  5: [
    { start: '10:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ],
  6: [{ start: '09:00', end: '13:00' }],
  7: [],
}

export const DEFAULT_SETTINGS = {
  slotInterval: 5,
  bufferBefore: 10,
  bufferAfter: 20,
  workingHours: DEFAULT_HOURS,
}

const DAYS = [
  { key: 1, label: 'Lunes' },
  { key: 2, label: 'Martes' },
  { key: 3, label: 'Miércoles' },
  { key: 4, label: 'Jueves' },
  { key: 5, label: 'Viernes' },
  { key: 6, label: 'Sábado' },
  { key: 7, label: 'Domingo' },
]

export { DAYS }

export const useSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const s = await getSettings()
      if (s) {
        const merged = { ...DEFAULT_SETTINGS, workingHours: { ...EMPTY_HOURS, ...s.workingHours } }
        setSettings(merged)
        return merged
      }
      return null
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }

  const update = async (patch) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    try {
      const saved = await saveSettings(next)
      setSettings(saved)
      return { ok: true }
    } catch (err) {
      console.error('saveSettings failed:', err)
      return { ok: false, message: err.message }
    }
  }

  const setDayRanges = (day, ranges) => {
    const workingHours = { ...settings.workingHours, [day]: ranges }
    update({ workingHours })
  }

  return { settings, loading, load, update, setDayRanges }
}