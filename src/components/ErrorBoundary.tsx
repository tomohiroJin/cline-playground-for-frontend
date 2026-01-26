import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  height: 100%;
  padding: 2rem;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(8px);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #ff6b6b;
`;

const Message = styled.p`
  margin-bottom: 2rem;
  color: var(--text-secondary);
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: var(--accent-color, #00d2ff);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  font-size: 1rem;

  &:hover {
    opacity: 0.9;
  }
`;

const HomeLink = styled.a`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--text-secondary);
  border-radius: 8px;
  color: var(--text-primary);
  text-decoration: none;
  transition: background 0.2s;
  font-size: 1rem;
  font-weight: 600;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer role="alert">
          <Title>予期せぬエラーが発生しました</Title>
          <Message>
            申し訳ありませんが、処理中にエラーが発生しました。
            <br />
            一時的な問題の可能性があります。
          </Message>
          <ButtonGroup>
            <Button onClick={this.handleRetry}>再試行</Button>
            <HomeLink href="/">ホームに戻る</HomeLink>
          </ButtonGroup>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
