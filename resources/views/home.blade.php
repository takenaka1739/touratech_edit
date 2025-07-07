<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>{{ config('app.name', 'Laravel') }}</title>
<link rel="preload" href="/assets/fonts/MaterialIcons-Regular.woff2" as="font" type="font/woff2" crossorigin>
<script src="{{ assets('/assets/js/index.js') }}" defer></script>
<link href="{{ assets('/assets/css/index.css') }}" rel="stylesheet">
</head>
<body>
<noscript>このサイトはJavaScriptに最適化されています。JavaScriptが無効になっている場合は、有効にしてください。</noscript>
<div id="app"></div>
</body>
</html>
