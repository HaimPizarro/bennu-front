let listeners = []
let toasts = []
let nextId = 0

function emit() {
  listeners.forEach((l) => l(toasts))
}

function push(message, type = 'success') {
  const id = ++nextId
  toasts = [...toasts, { id, message, type }]
  emit()
  setTimeout(() => remove(id), 4000)
}

function remove(id) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function subscribe(listener) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getSnapshot() {
  return toasts
}

export const toast = {
  success: (msg) => push(msg, 'success'),
  error: (msg) => push(msg, 'error'),
  subscribe,
  getSnapshot,
}
