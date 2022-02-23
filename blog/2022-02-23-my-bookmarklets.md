# 我的一些 Bookmarklet

之前写过一些简单的 bookmarklet，例如阻止 tab 被误关闭等。

<!--truncate-->

## 什么是 Bookmarklet？
Bookmarklet是一个复合词，由Bookmark（书签）和-let（小的）构成，中文可以译成"书签工具"。

它在形式上与"书签"一样，都保存在浏览器收藏夹里。但是，它不是一个以"http://"开头的网址，而是一段 JavaScript 代码，以"javascript:"开头。点击之后，会对当前页面执行某种操作。

## 如何使用？ 

直接把下面的超链接拖入到书签栏，需要使用时点击一下即可。 

## 1. 阻止关闭页面
<a href='javascript: window.onbeforeunload = () => "Are you sure?";'>阻止关闭页面</a>

关闭 Tab 或浏览器时弹出确认框，避免手滑关闭一些重要的页面

## 2. 复制不带协议的域名和网址

<a href="javascript:(function(){ const el = document.createElement('textarea'); el.value = decodeURIComponent(window.location.host); document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); })();">复制域名</a>
<br/>
<a href="javascript:(function(){ const el = document.createElement('textarea'); el.value = decodeURIComponent(window.location.host + '/' + window.location.pathname + window.location.search); document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); })();">复制网址(不带协议)</a>

避免复制域名时 chrome 总是"贴心"的给你加上协议标识

## 3. 自由编辑网页
<a href="javascript: document.body.contentEditable=true">自由编辑页面</a>

让网页变成一个富文本编辑器，可以自由修改