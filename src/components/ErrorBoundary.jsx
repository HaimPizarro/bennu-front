import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="dash__error" role="alert">
          <p className="eyebrow">Algo salió mal</p>
          <h1 className="dash__title">No se pudo mostrar esta sección</h1>
          <p className="muted">{String(this.state.error?.message || this.state.error)}</p>
          <button className="btn btn--primary btn--sm" type="button" onClick={() => this.setState({ error: null })}>
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}