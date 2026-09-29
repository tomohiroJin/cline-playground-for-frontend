/**
 * 灰燼の城壁 - 画面共通レイアウト定数
 *
 * 共通ヘッダー（App.tsx）は非表示のフルスクリーンルートでも、代わりに
 * `FloatingHomeButton`（position: fixed; top: 12px; left: 12px; 40x40px）が
 * 常に画面左上に重なって表示される（設計書 §7 の実測で判明。ブリーフ記載の
 * `<header>` 要素は本ゲームのルートには存在しなかった）。
 *
 * このボタンは App.tsx の共通レイヤーで 14 ゲームすべてが依存しているため
 * 共通側は変更せず、各画面の実装側で余白を確保して吸収する。
 *
 * 実測値: ボタン下端 = top(12px) + height(40px) = 52px。
 * 52px ちょうどだと縁が接するため、8px の余裕を足して 64px を採用する。
 */
export const HEADER_CLEARANCE = '64px';

/**
 * 戦闘中に高さが変わる要素を置かないための「予約した枠」の高さ（反復7 段階2・設計書 §4.0 a）
 *
 * 段階1 の試遊で「画面のサイズがコロコロ変わり、戦闘開始時に慌てる」と言われた。
 * 一時表示（拒否理由・能力表示・溢れ通知・ライフが減った理由）が出るたびに
 * 盤面と手札が押し下げられていた。一時表示は空のときも同じ高さを占める枠に出す。
 */
/** 盤面の下の拒否理由の1行 */
export const BOARD_INFO_LINE_PX = 20;
/** 拒否理由と能力表示の間 */
export const BOARD_INFO_GAP_PX = 4;
/** 能力表示の1行（チップは折り返さず横へ流す） */
export const INSPECT_ROW_HEIGHT_PX = 36;
/** 盤面の下の枠の全体 */
export const BOARD_INFO_SLOT_HEIGHT_PX = BOARD_INFO_LINE_PX + BOARD_INFO_GAP_PX + INSPECT_ROW_HEIGHT_PX;
/** 手札の上の通知の1行 */
export const HAND_NOTICE_LINE_PX = 20;
/** 手札の上の通知の行数（これを超える通知は優先順の下位を出さない） */
export const HAND_NOTICE_MAX_LINES = 2;
