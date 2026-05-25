import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] 렌더링 오류:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
          <div className="bg-error-container text-on-error-container rounded-2xl p-8 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">렌더링 오류 발생</h2>
            <pre className="text-xs whitespace-pre-wrap break-all bg-black/10 rounded-xl p-4">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-6 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
