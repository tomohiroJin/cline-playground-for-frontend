// セクション 6 の全テキスト定数

// プロジェクト提示テキスト
export const PROJECT_INTRO_TEXT = `PM：
「新規のタスク管理ツールの開発をお願いしたい。
社内で使うもので、まずは基本機能が動くところまで。

期限は3スプリント。短いが、まずは最低限の形にしてほしい。
経営層も注目しているプロジェクトだ。
要件は……正直、まだ固まりきっていない部分もある。
走りながら詰めていくことになると思う。

期待しているよ。」`;

// チーム結成テキスト
export const TEAM_FORMATION_TEXT = `あなたのチームが決まった。全員、今回が初めてのプロジェクトだ。

■ PdM（プロダクトマネージャー）
  方向性と価値の声。
  「何を作れば意味があるか、ちゃんと考えたい」

■ FE（フロントエンドエンジニア）
  ユーザー体験を形にする。
  「まずは触れるものを早く作りたいタイプです」

■ BE（バックエンドエンジニア）
  プロダクトの土台を支える。
  「基盤がしっかりしてないと、あとで絶対困りますよ」

■ QA（品質保証）
  品質とリスクを守る。
  「出す前にちゃんと確認させてください……」

■ デザイナー
  意味と一貫性をつなぐ。
  「ユーザーに伝わらなかったら、作った意味がないですから」

全員やる気はある。ただ、経験は浅い。`;

// 開発フレーバーテキスト
export const DEVELOPMENT_FLAVOR_TEXTS: Record<string, string> = {
  sprint1: '初めてのスプリント。手探りだが、チームの空気は悪くない。',
  sprint2_high: '2回目のスプリント。少しずつ要領がわかってきた。',
  sprint2_low: '2回目のスプリント。コードの粗さが気になり始めている。',
  sprint3_high: '最終スプリント。ここまで来た。最後まで走り切ろう。',
  sprint3_low: '最終スプリント。積み残しが重い。何を優先するか──。',
};

// 品質警告テキスト
export const QUALITY_WARNING_TEXTS: Record<string, string> = {
  excellent: '品質は安定している。自信を持って出せる状態だ。',
  good: '大きな問題はなさそうだが、細かい粗は残っている。',
  risky: '正直、不安が残る。出すかどうかは判断が分かれるところだ。',
  dangerous: 'かなり荒い。このまま出すとトラブルになるかもしれない。',
};

// リリースリスクテキスト
export const FULL_RELEASE_RISK_TEXTS: Record<string, string> = {
  safe: '現状なら大きな問題はないだろう。',
  risky: 'ただし、品質が低いままリリースすると信頼に影響するかもしれない。',
};

// ユーザー反応テキスト（レビュー用）
export const USER_REVIEW_TEXTS: Record<string, string> = {
  postpone:
    'ユーザー：今回は新しい機能が届かなかった。次に期待したい。',
  high:
    'ユーザー：使える機能が増えてきた。これは助かる。',
  mid:
    'ユーザー：少しずつ形になってきている。もう少し充実すると嬉しい。',
  low:
    'ユーザー：まだ使えるものが少ない。本当に間に合うのだろうか。',
};

// ステークホルダー反応テキスト（レビュー用）
export const STAKEHOLDER_REVIEW_TEXTS: Record<string, string> = {
  postpone:
    'ステークホルダー：リリースが見送られた。進捗は大丈夫か？',
  high:
    'ステークホルダー：順調だな。この調子で頼むよ。',
  mid:
    'ステークホルダー：まあ、悪くはない。引き続き注視している。',
  low:
    'ステークホルダー：少し心配している。次はもう少し成果を見せてほしい。',
};

// 品質追加コメント
export const QUALITY_COMMENT =
  '※ 一部のユーザーから「動作が不安定だ」という声が上がっている。';

// 振り返りナレーション
export const RETROSPECTIVE_NARRATIVES: Record<string, string> = {
  both_high:
    '機能も品質も、最低限の形にはなった。チームとして悪くない仕事ができたと思う。',
  progress_high_quality_low:
    '機能は揃ったが、品質には不安が残る。動くものは作れた──でも、これでいいのだろうか。',
  progress_low_quality_high:
    '品質は守れたが、届けられた機能は多くない。堅実だが、期待に応えられたかは微妙だ。',
  both_low:
    '正直、厳しいスプリントだった。足りないものだらけだが、チームは最後まで走った。',
};

// PM の一言（リザルト用）
export const PM_RESULT_TEXTS: Record<string, string> = {
  A: 'PM：正直、新人チームでここまでやれるとは思わなかった。よくやった。',
  B: 'PM：完璧ではないが、ちゃんと形になった。次も頼むよ。',
  C: 'PM：課題は多いが、走り切ったことは評価している。次に活かしてほしい。',
  D: 'PM：厳しい結果だったな……。でも、ここから学べることは多いはずだ。',
};

// ユーザー反応テキスト（リザルト用）
export const USER_RESULT_TEXTS: Record<string, string> = {
  high:
    'ユーザー：必要な機能が揃ってきた。これなら日常的に使えそうだ。',
  mid:
    'ユーザー：まだ足りない部分はあるけど、方向性は悪くない。',
  low:
    'ユーザー：正直、まだ実用には遠い。次のアップデートに期待するしかない。',
};

// ステークホルダー態度テキスト（リザルト用）
export const STAKEHOLDER_RESULT_TEXTS: Record<string, string> = {
  high:
    'ステークホルダー：このチームには安心して任せられる。継続して予算をつけよう。',
  mid:
    'ステークホルダー：悪くはない。ただ、もう少し目に見える成果がほしいところだ。',
  low:
    'ステークホルダー：率直に言って、期待を下回っている。体制の見直しが必要かもしれない。',
};

// チームの空気テキスト（リザルト用）
export const TEAM_RESULT_TEXTS: Record<string, string> = {
  good:
    'チーム：大変だったけど、やりきった。もう少しうまくできた気もするけど、悪くない。',
  ok:
    'チーム：反省点は多い。でも、次はもう少しうまくやれる気がする。',
  tough:
    'チーム：正直、きつかった。でも──逃げなかったのは、悪くなかったと思う。',
};

// リザルト画面のエンディングテキスト
export const RESULT_ENDING_TEXT = `開発は続く。
でも今は──走り続けられる状態を、作れただろうか。`;

// ヘッダー表示テキスト
export const PHASE_HEADERS: Record<string, string> = {
  TITLE: '',
  PROJECT_INTRO: 'プロジェクト提示',
  TEAM_FORMATION: 'チーム結成',
  GOAL_SELECTION: 'ゴール選択',
  RESULT: 'プロジェクト完了',
};

// スプリントフェーズヘッダーを生成する
export const getSprintPhaseHeader = (
  sprint: number,
  phaseName: string
): string => `Sprint ${sprint} / 3 ── ${phaseName}`;

// スプリントフェーズ名マッピング
export const SPRINT_PHASE_NAMES: Record<string, string> = {
  PLANNING: 'プランニング',
  DEVELOPMENT: '開発',
  RELEASE: 'リリース判断',
  REVIEW: 'レビュー',
  RETROSPECTIVE: '振り返り',
};
