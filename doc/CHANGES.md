# 変更履歴

## 2025-07-31

### 追加 (Added)

-   Reactプロジェクトのひな形を作成
-   仕様書に基づき、以下のコンポーネントとカスタムフックのファイルを追加
    -   `App.js`, `Sidebar.js`, `FilterModal.js`, `GpxInfoOverlay.js`, `ElevationGraph.js`
    -   `hooks/useMap.js`, `hooks/useGpx.js`, `hooks/useUI.js`
-   `Split.js`を導入し、PC表示時に各エリアのサイズをドラッグで変更できるようにした
-   レスポンシブ対応を追加
    -   モバイル表示（幅768px以下）ではサイドバーをオーバーレイ表示に切り替え
    -   ハンバーガーメニューによるサイドバーの開閉機能を実装
-   Gitリポジトリを初期化し、`.gitignore`ファイルを作成
-   変更履歴を記録するための`CHANGES.md`を作成
