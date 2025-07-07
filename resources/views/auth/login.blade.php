<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<title>{{ config('app.name', 'Laravel') }}</title>
<meta name="robots" content="noindex">
<link href="{{ assets('assets/css/login.css') }}" rel="stylesheet">
</head>
<body>
<div id="wrapper">

<header class="header">
  <div class="header__container">
    <h1 class="header__logo">{{ config('app.name', 'Laravel') }}</h1>
  </div>
</header>

<main class="main">
  <div class="main__container">
    <div>
      <div class="main__logo">
        <img src="/assets/img/logo.svg" alt="ツアラテックジャパン" width="230" height="150">
      </div>
    </div>

    <form method="post" action="{{ route('login') }}">
      @csrf

      <div class="form-group">
        <label for="login_id" class="form-label">ID</label>
        <div>
          <input id="login_id" type="text" class="form-input @error('login_id') is-invalid @enderror" name="login_id" value="{{ old('login_id') }}" required autofocus>
          @error('login_id')
            <span class="invalid-feedback" role="alert">
              <strong>{{ $message }}</strong>
            </span>
          @enderror
        </div>
      </div>
      <div class="form-group">
        <label for="password" class="form-label">パスワード</label>
        <div>
          <input id="password" type="password" class="form-input @error('password') is-invalid @enderror" name="password" required>
          @error('password')
            <span class="invalid-feedback" role="alert">
              <strong>{{ $message }}</strong>
            </span>
          @enderror
        </div>
      </div>

      <div class="form-group">
        <button type="submit" class="form-btn">ログイン</button>
      </div>
    </form>
  </div>
</main>
</div>
</body>
</html>
