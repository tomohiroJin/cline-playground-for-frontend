import React from 'react';
import { ClearHistory } from '../../utils/storage-utils';
import { formatElapsedTime } from '../../utils/puzzle-utils';

/**
 * クリア履歴リストのプロパティの型定義
 */
type ClearHistoryListProps = {
  history: ClearHistory[];
};

/**
 * クリア履歴リストコンポーネント
 *
 * @param history クリア履歴の配列
 */
const ClearHistoryList: React.FC<ClearHistoryListProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="text-center p-5 text-gray-600 italic">クリア履歴はありません</div>
    );
  }

  return (
    <div className="mt-5 w-full max-w-[600px] bg-gray-100 rounded-lg p-4 shadow">
      <h3 className="text-lg mb-3 text-gray-800 border-b-2 border-gray-300 pb-2">クリア履歴</h3>
      <ul className="list-none p-0 m-0 max-h-[300px] overflow-y-auto">
        {history.map(entry => (
          <li
            key={entry.id}
            className="p-3 border-b border-gray-300 flex justify-between items-center last:border-b-0 hover:bg-gray-200"
          >
            <div className="font-bold text-blue-600">{entry.imageName}</div>
            <div className="flex flex-col items-end">
              <div className="font-bold text-green-600">
                クリアタイム: {formatElapsedTime(entry.clearTime)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(entry.clearDate).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClearHistoryList;
