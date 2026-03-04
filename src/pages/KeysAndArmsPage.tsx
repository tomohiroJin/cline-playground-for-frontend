import React from 'react';
import KeysAndArmsGame from '../features/keys-and-arms/KeysAndArmsGame';
import { useGameFont } from '../hooks/useGameFont';

const KeysAndArmsPage: React.FC = () => {
  useGameFont('keys-and-arms');

  return <KeysAndArmsGame />;
};

export default KeysAndArmsPage;
