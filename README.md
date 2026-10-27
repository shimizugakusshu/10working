# Build and test a multi-tier application with GitHub Copilot

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey shimizugakusshu!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/shimizugakusshu/10working/issues/1)

## OctoFit Tracker

### アプリの起動方法

Node.jsとnpmをインストールし、MongoDBをポート`27017`で起動してください。バックエンドの既定の接続先は`mongodb://localhost:27017/octofit_db`です。

依存関係をインストールします。

```bash
cd octofit-tracker/backend
npm ci
cd ../frontend
npm ci
```

MongoDBを起動した状態で、次のコマンドをそれぞれ別のターミナルで実行してください。

```bash
cd octofit-tracker/backend
npm run seed
npm run dev
```

```bash
cd octofit-tracker/frontend
npm run dev
```

ブラウザーで <http://localhost:5173> を開くと、OctoFit Trackerを利用できます。APIはポート`8000`で起動し、フロントエンドからのAPIリクエストはVite経由で転送されます。

### テストの実行方法

バックエンドとフロントエンドのテストは、それぞれのディレクトリで実行します。

```bash
cd octofit-tracker/backend
npm test
```

```bash
cd octofit-tracker/frontend
npm test
```

バックエンドのテストは`mongodb-memory-server`を使って一時的なMongoDBを起動するため、通常はローカルのMongoDBサーバーを起動する必要はありません。初回実行時はMongoDBバイナリのダウンロードが発生する場合があります。
