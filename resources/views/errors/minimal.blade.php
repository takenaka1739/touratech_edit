<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@yield('title')</title>
<style>
html, body {
  background-color: #fff;
  color: #636b6f;
  height: 100vh;
  margin: 0;
}
.center {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.message {
  font-size: 18px;
  text-align: center;
}
.message a {
  margin-top: 20px;
  font-size: 14px;
  color: #636b6f;
}
</style>
</head>
<body>
<div class="center">
  <div class="message">
    @yield('message')

    <p><a href="/">TOPページへ戻る</a></p>
  </div>
</div>
</body>
</html>
