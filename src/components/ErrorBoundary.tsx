import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// C12 fix: the app had zero Error Boundaries anywhere (verified by grep across
// src for ErrorBoundary / componentDidCatch / getDerivedStateFromError — no
// results). Any uncaught exception in any component's render — including the
// localStorage failures fixed separately in C10/C11, or any other future bug —
// used to take the entire React tree down to a permanently blank white screen,
// with no recovery path for the user short of manually clearing site data.
// This wraps <App/> once, at the root, so any such crash instead shows a
// recoverable message with a reload button.
export class ErrorBoundary extends Component<Props, State> {
  // This project has no @types/react package installed (pre-existing, out of
  // scope here), so TS infers Component's shape from react's plain JS source
  // instead of proper types and misses `this.props`. `declare` just asserts
  // the type for the compiler; React itself still sets the real prop values
  // at runtime via the base class constructor as usual.
  declare props: Props;
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SafeSpend crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            background: '#030d0a',
            color: '#f1f5f9',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 700 }} dir="rtl">
            حدث خطأ غير متوقع، وبياناتك المحفوظة لم تتأثر.
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Something went wrong. Your saved data was not affected.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '8px',
              padding: '10px 24px',
              borderRadius: '12px',
              border: 'none',
              background: '#10b981',
              color: '#030d0a',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            إعادة المحاولة / Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
