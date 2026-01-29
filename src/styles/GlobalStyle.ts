import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    --bg-gradient: linear-gradient(135deg, #0cebeb, #20e3b2, #29ffc6); /* 鮮やかなティール系グラデーション（初期値） - ダークモードで上書き推奨 */
    --text-primary: #333;
    --text-secondary: #666;
    --accent-color: #4caf50;
    --glass-bg: rgba(255, 255, 255, 0.8);
    --glass-border: rgba(255, 255, 255, 0.5);
    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  }

  /* Dark Theme / Premium Theme Override */
  body.premium-theme {
    --bg-gradient: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    --text-primary: #ffffff;
    --text-secondary: rgba(255, 255, 255, 0.75);
    --accent-color: #00d2ff;
    --glass-bg: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--bg-gradient);
    background-size: 400% 400%;
    animation: gradientBG 15s ease infinite;
    color: var(--text-primary);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background 0.5s ease;
  }

  @keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
  }
`;
