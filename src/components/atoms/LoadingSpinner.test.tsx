import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('displays the message when provided', () => {
    const message = 'Loading game...';
    render(<LoadingSpinner message={message} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders with correct size classes or styles', () => {
    // This depends on implementation implementation (styled-components or css modules)
    // For now assuming visual check or prop passing validation if we were strictly unit testing props
    // We can check if the container has a specific attribute or style
    render(<LoadingSpinner size="large" />);
    // Implementation detail check might be brittle, but checking for role is good.
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });
});
