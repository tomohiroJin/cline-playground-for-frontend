/**
 * 飲み物を作るステップを表す型です。
 * - brew: コーヒーや紅茶などを抽出する関数
 * - addCondiments: 砂糖・ミルク・レモンなどを追加する関数
 */
export type BeverageSteps = {
  brew: () => void;
  addCondiments: () => void;
};

/**
 * 関数型での「テンプレートメソッド」に相当する関数です。
 * 一連の処理(お湯を沸かす → 抽出 → カップに注ぐ → 調味料を加える)の流れを固定し、
 * brew, addCondiments は引数で受け取った関数を呼び出します。
 */
export function prepareBeverage(steps: BeverageSteps): void {
  boilWater();
  steps.brew(); // 差し替え可能
  pourInCup();
  steps.addCondiments(); // 差し替え可能
}

/**
 * お湯を沸かす (共通ステップ)
 */
function boilWater(): void {
  console.log("お湯を沸かします");
}

/**
 * カップに注ぐ (共通ステップ)
 */
function pourInCup(): void {
  console.log("カップに注ぎます");
}

/**
 * コーヒーを作るときの手順をまとめたオブジェクト
 * brew: コーヒーをドリップ
 * addCondiments: 砂糖とミルクを追加
 */
export const coffeeSteps: BeverageSteps = {
  brew: () => {
    console.log("コーヒーをドリップします");
  },
  addCondiments: () => {
    console.log("砂糖とミルクを追加します");
  },
};

/**
 * 紅茶を作るときの手順をまとめたオブジェクト
 * brew: ティーバッグを浸す
 * addCondiments: レモンを追加
 */
export const teaSteps: BeverageSteps = {
  brew: () => {
    console.log("ティーバッグを浸します");
  },
  addCondiments: () => {
    console.log("レモンを追加します");
  },
};
