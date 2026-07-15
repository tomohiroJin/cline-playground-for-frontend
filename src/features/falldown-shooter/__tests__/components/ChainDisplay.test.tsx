import { render, screen } from '@testing-library/react';
import { ChainDisplay } from '../../components/ChainDisplay';

describe('ChainDisplay', () => {
  test('chain>=2 のとき「N CHAIN!」を表示すること', () => {
    render(<ChainDisplay chain={3} />);
    expect(screen.getByText(/3 CHAIN/)).toBeInTheDocument();
  });

  test('chain<2 のときは何も表示しないこと', () => {
    const { container } = render(<ChainDisplay chain={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});
