# IPNE ドキュメント

**IPNE (Investigation in Progress: No Escape)** - 調査中につき脱出不能

短時間・判断型・見下ろし迷路アクションゲームの設計・仕様ドキュメント。

---

## クイックリンク

### メイン仕様書

| ドキュメント | 内容 |
|-------------|------|
| [00-overview.md](./specs/00-overview.md) | ゲーム概要・コンセプト・MVPロードマップ |
| [01-worldview.md](./specs/01-worldview.md) | 世界観・ビジュアル設計・ナラティブ |
| [02-gameplay.md](./specs/02-gameplay.md) | ゲームプレイ仕様・職業・戦闘・評価 |
| [03-entities.md](./specs/03-entities.md) | エンティティ一覧（敵・罠・壁・アイテム） |
| [04-progression.md](./specs/04-progression.md) | 成長・レベルアップシステム |
| [05-technical.md](./specs/05-technical.md) | 技術仕様（迷路生成・AI等） |
| [06-controls.md](./specs/06-controls.md) | 操作方法・デバッグモード |

### MVP別詳細仕様

| MVP | ドキュメント | 状態 |
|-----|-------------|------|
| MVP0 | [mvp/00/](./mvp/00/) | 完了 |
| MVP1 | [mvp/01/](./mvp/01/) | 完了 |
| MVP2 | [mvp/02/](./mvp/02/) | 進行中 |
| MVP3 | [mvp/03/](./mvp/03/) | 進行中 |
| MVP4 | [mvp/04/](./mvp/04/) | 計画中 |

---

## ドキュメント構成

```
.docs/ipne/
├── README.md                  # このファイル（インデックス）
├── specs/                     # メイン仕様書
│   ├── 00-overview.md         # ゲーム概要・コンセプト
│   ├── 01-worldview.md        # 世界観・ビジュアル設計
│   ├── 02-gameplay.md         # ゲームプレイ仕様
│   ├── 03-entities.md         # エンティティ一覧
│   ├── 04-progression.md      # 成長・レベルアップシステム
│   ├── 05-technical.md        # 技術仕様
│   └── 06-controls.md         # 操作方法・デバッグモード
├── mvp/                       # MVP別計画・タスク
│   ├── 00/                    # MVP0: 歩けて脱出できる
│   ├── 01/                    # MVP1: 自動生成迷路＋調査体験
│   ├── 02/                    # MVP2: 敵・HP・最低限の戦闘
│   ├── 03/                    # MVP3: 成長・職業差・罠拡張
│   └── 04/                    # MVP4: 仕上げ・演出・リプレイ価値
└── archive/                   # 旧ドキュメント
    └── old-specs/             # 再構成前のspecsファイル
```

---

## 読み方ガイド

### 初めて読む場合

1. **[00-overview.md](./specs/00-overview.md)** でゲームの全体像を把握
2. **[01-worldview.md](./specs/01-worldview.md)** で世界観・トーンを理解
3. 興味のある分野のドキュメントを参照

### 実装時に参照する場合

- **ゲームシステム**: [02-gameplay.md](./specs/02-gameplay.md)
- **エンティティ仕様**: [03-entities.md](./specs/03-entities.md)
- **成長システム**: [04-progression.md](./specs/04-progression.md)
- **技術詳細**: [05-technical.md](./specs/05-technical.md)
- **操作・デバッグ**: [06-controls.md](./specs/06-controls.md)

### MVP詳細を確認する場合

各MVP フォルダには以下のファイルがある：

- `plan.md` - 計画・目的
- `spec.md` - 詳細仕様
- `tasks.md` - タスク管理

---

## 現在の実装状態

### 完了済み

- **MVP0**: 固定迷路、移動、ゴール到達
- **MVP1**: 自動生成迷路（BSP）、自動マッピング、ビューポート

### 進行中

- **MVP2**: 敵AI、HP、戦闘、アイテム
- **MVP3**: 職業差、成長システム、罠・壁ギミック

### 計画中

- **MVP4**: タイマー、評価システム、チュートリアル、演出強化

---

## ゲーム概要

> 突如出現した不安定なダンジョンに調査員として侵入し、
> 自動生成される迷路を探索・判断しながら、
> ボスを撃破して鍵を入手し脱出する。

### 特徴

- 1プレイ 5〜10分
- 操作は単純、判断は多い
- 職業（戦士/盗賊）による情報取得の差
- レベルアップによる成長選択
- クリアタイムによる5段階評価（S/A/B/C/D）

---

## 関連リンク

- ゲーム本体: `/ipne` (開発サーバー起動後)
- デバッグモード: `/ipne?debug=1`

---

## 更新履歴

- 2024-XX-XX: ドキュメント再構成（specs/ を整理）
