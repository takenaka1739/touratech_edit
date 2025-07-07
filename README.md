# ツアラテック受注管理システム

## 概要
フロントエンドは react(typescript)、
バックエンドは PHP で、フレームワークに Laravel 6.* を使用しています。

## 開発環境
* PHP 7.3
* MYSQL 5.6
* Node.js 14.15.3

## 開発環境の作成


## 本番環境の作成
最初に、 Laravel の動作環境を作成するためサーバーに SSH で接続しておきます。
SSH 接続の方法は使用するサーバーのマニュアルを確認してください。

### Composer のインストール
Laravel および依存パッケージのインストールに必要な [Composer](https://getcomposer.org/) をインストールします。
次のコマンドを実行し、 Composer をインストールします。

```
$ curl -sS https://getcomposer.org/installer | php
```

次のコマンドでインストールされているか確認します。

```
$ composer -v
   ______
  / ____/___  ____ ___  ____  ____  ________  _____
 / /   / __ \/ __ `__ \/ __ \/ __ \/ ___/ _ \/ ___/
/ /___/ /_/ / / / / / / /_/ / /_/ (__  )  __/ /
\____/\____/_/ /_/ /_/ .___/\____/____/\___/_/
                    /_/
Composer version 1.10.8 2020-06-24 21:23:30
```

上記のようにバージョン名が表示されていれば、インストールが完了しています。
ついでに並列化プラグインをインストールしておきます。

```
$ composer self-update
$ composer global require hirak/prestissimo
```

### ソースファイルのアップロード
ソースファイル一式を FTP でアップロードします。この時、アップロード先のフォルダは公開フォルダの外にしておきます。
ここでは root 直下に laravel というフォルダを作成し、そこにアップロードします。

#### パーミッション
一部ファイルのパーミッションを変更します。

```
$ chmod -R 777 storage
$ chmod -R 775 bootstrap/cache
```

#### シンボリックリンクの作成
公開させるには、アクセスしたいフォルダにプロジェクト直下にある `/public` ディレクトリのシンボリックリンクを設定します。
例えば、公開フォルダが `web` の場合で `/` でアクセスさせたい場合は以下のようにします。

```
$ ln -s ~/laravel/public ~/web
```

### Laravel と依存パッケージのインストール
プロジェクトのルートディレクトリに移動し、次のコマンドを実行します。

```
$ cd ~/laravel
$ composer install --optimize-autoloader --no-dev
```

### .env ファイルの作成
ソースファイル内にある .env.example ファイルをコピーして .env ファイルを作成します。
主に設定する部分は以下の部分になります。

```:.env
APP_NAME=ツアラテック受注管理システム
APP_ENV=production
APP_KEY=[後の「 APP_KEY の生成」を参照]
APP_DEBUG=false
APP_URL=[本番環境のURL]

LOG_CHANNEL=daily

DB_CONNECTION=mysql
DB_HOST=[データベースのホスト名]
DB_PORT=3306
DB_DATABASE=[データベース名]
DB_USERNAME=[ユーザー名]
DB_PASSWORD=[パスワード]

MAIL_DRIVER=smtp
MAIL_HOST=[smtpホスト]
MAIL_PORT=2525
MAIL_USERNAME=[]
MAIL_PASSWORD=[]
MAIL_FROM_ADDRESS=[メールのFromアドレス]
```

#### APP_KEY の生成
次のコマンドを実行し .env ファイル内の APP_KEY を生成します。

```
$ php artisan key:generate
```

すると、 .env ファイル内の APP_KEY に以下のようなキーが生成されます。

```:.env
APP_KEY=base64:VBR+p+vbT+gn7soGzUJ41sJIpQH/I8zLWBdALqFPS4Y=
```

### 設定ファイルの最適化

```
$ php artisan config:cache
```

### ルートロードの最適化

```
$ php artisan route:cache
```
