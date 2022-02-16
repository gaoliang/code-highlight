---
date: 2022-01-23 20:00:00
authors: [gaoliang]
tags: [react,browser-extension]
---

# 使用 create-react-app 脚手架构建浏览器插件 

之前用 vue2 写过一个[开发环境指示器](https://chrome.google.com/webstore/detail/environment-indicator/kgdbcpllbbnimjgoiomfdebldcofmlbl)插件，目前已经有了400多位用户，最近又有了新的 Idea，准备尝试一下用 react 来写。

<!--truncate-->

## 准备 react 脚手架

这里使用 [create-react-app](https://create-react-app.dev/) 脚手架来生成 react 代码项目结构

```bash
yarn create create-react-app some-extension
```

执行完成后得到初始的项目结构如下

```
.
├── README.md
├── package.json
├── public
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── src
│   ├── App.css
│   ├── App.js
│   ├── App.test.js
│   ├── index.css
│   ├── index.js
│   ├── logo.svg
│   ├── reportWebVitals.js
│   └── setupTests.js
└── yarn.lock
```

此时生成的代码是为开发网页应用来设计的， 我们需要对他做一些小改动来适配浏览器插件的文件结构

## 配置浏览器插件结构

参照 chrome 的浏览器插件[文档](https://developer.chrome.com/docs/extensions/mv3/) , 我们需要对项目结构进行一些调整，以适配浏览器插件。 

### 1. 配置 manifest.json 清单文件

create-react-app 生成的 manifest.json 文件是为 [PWA](https://developer.mozilla.org/en-US/docs/Web/Manifest) 应用使用的，并不是给浏览器扩展使用的，我们需要修改成浏览器扩展的清单文件，这里采用新版 [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/) 格式的清单文件。

```json
{
  "name": "Tab Tree",
  "description": "Tree view for your browser tabs",
  "version": "1.0",
  "manifest_version": 3,
  "permissions": ["tabs", "storage"],
  "action": {
    "default_popup": "index.html"
  }
  "options_page": "index.html",
}
```

浏览器插件通常需要 [后台脚本](https://developer.chrome.com/docs/extensions/mv3/background_pages/), [内容脚本](https://developer.chrome.com/docs/extensions/mv3/content_scripts/),  [可选的页面](https://developer.chrome.com/docs/extensions/mv3/options/) 组成，这里我们先只配置 popup 和 options 配置页，即点击浏览器图标弹出的页面和插件的选项页面。 

由于都指向了编译后的 index.html 文件，两个页面此时展示的内容是一样的。 

同时，我们可以移除 `public/index.html` 中对 manifest.json 的引用，因为浏览器扩展并不需要被另存为 PWA 应用。 



### 2. 构建并加载应用页面

执行 `yarn build` 可以将应用构建到 build 目录下，打开浏览器 `chrome://extensions/` 页面，选择开发者模式，加载已解压的扩展程序，选择 build 目录，就可以将插件安装到浏览器中。

![image-20220123203827882](imgs/image-20220123203827882.png) 

点击菜单中的插件按钮，可以看到页面成功现实在了 popup 页面中，只不过页面大小和插件图标都没有配置。 

![image-20220123203904717](imgs/image-20220123203904717.png)

### 3. 配置 webpack multi entry 以打包 background.js 和 content.js

background.js 是运行在后台的 js 脚本，可以和浏览器扩展 API  进行交互，content.js 是被注入到浏览器页面中的脚本，不可以和浏览器扩展 API 交互，但是可以和 background.js 进行交互。 

为了能够使用现代化的前端工作流，我们需要对  background.js 和 content.js 进行打包。但 create-react-app 背后的 react-scripts 帮助我们管理了 webpack、babel 等各种配置，默认情况下，webpack 只有一个 entry，因此需要修改 create-react-app 默认的 webpack 配置，增加 entry。 

修改 create-react-app 的配置通常有两种方法，一种是使用 npm run eject 将所有的配置项都弹出，不再隐藏，但这样的问题是后续都需要手动维护所有的配置，遇到 create-react-app 升级时，就会非常痛苦。 另外一种是使用 craco 或者 react-app-rewired 这样的工具，在不 eject 的情况下修改部分配置。 

这里我们使用 craco 进行修改。 

craco.config.js 的配置如下

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = () => {
    return {
        webpack: {
            configure: (webpackConfig, { env }) => {
                if (env !== 'development') {
                    const htmlWebpackPluginInstance = webpackConfig.plugins.find(
                        webpackPlugin => webpackPlugin instanceof HtmlWebpackPlugin
                    );
                    if (htmlWebpackPluginInstance) {
                        htmlWebpackPluginInstance.userOptions.chunks = ['main'];  // 只保留页面 js，避免注入 background.js
                    }
                }
                webpackConfig.entry = {
                    main: webpackConfig.entry,      // 默认的页面主入口
                    background: './src/background.js'      // background.js 入口
                }
                webpackConfig.output = {
                    ...webpackConfig.output,
                    filename: 'static/js/[name].js',       // 去掉 hash，避免生成的文件每次文件名不同
                }
                console.log(webpackConfig)
                return webpackConfig;
            },
        },
    };
};
```



我们在 src/background.js 中调用浏览器扩展接口

```js
// background.js
let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});
```

然后在 manifest 文件中关联这个文件

```json
{
  "name": "Tab Tree",
  "description": "Tree view for your browser tabs",
  "version": "1.0",
  "manifest_version": 3,
  "permissions": ["tabs", "storage"],
  "action": {
    "default_popup": "index.html"
  },
  "background": {
    "service_worker": "static/js/background.js"
  }
}
```

重新 build 并加载后，点击查看视图 Service Worker，就可以看到 background 的输出了。 

![image-20220123211046671](imgs/image-20220123211046671.png)

### 4. 让 popup、options 显示不同的页面

此问题其实有多个解决方案

1. 使用 multi entry 打包多个 html 静态页面。
2. 使用 react-router 的 hash 路由。 

为了减少插件体积，并且尽量少的修改 create-react-app 的配置，在这我们使用 react-router 的 hash 路由模式。

```html
        <HashRouter>
            <Routes>
                <Route path="/options" element={<Options />}>
                </Route>
                <Route path="/popup" element={<Popup />}>
                </Route>
            </Routes>
        </HashRouter>
```



manifest 调整为

```js
  "action": {
    "default_popup": "index.html#/popup"
  },
  "options_page": "index.html#/options",
```



## 其他问题记录

### 1. 使用 **[webextension-polyfill](https://github.com/mozilla/webextension-polyfill)**

[webextension-polyfill](https://github.com/mozilla/webextension-polyfill#supported-browsers) 是 [mozilla](https://github.com/mozilla) 开源的一个浏览器扩展兼容库，如果我们需要浏览器插件同时兼容 Chrome 和 Firefox，可以使用该库来抹平 API 差异。 另外一个好处是，该库提供的 API 是 Promise 风格的，可以更方便的组织代码。 

### 2.  组件库样式加载迟滞问题

使用 Ant Design 时，出现了 页面先出现原生样式的骨架，然后才逐渐出现框架样式的问题。经过排查发现是最新版的 webpack 注入 script 时，默认是注入到 head 中，添加 了 defer 标签异步执行的的。 修改为 注入到 body 中阻塞执行即可。  

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = () => {
    return {
        webpack: {
            configure: (webpackConfig, { env }) => {
                if (env !== 'development') {
                    const htmlWebpackPluginInstance = webpackConfig.plugins.find(
                        webpackPlugin => webpackPlugin instanceof HtmlWebpackPlugin
                    );
                    if (htmlWebpackPluginInstance) {
                        htmlWebpackPluginInstance.userOptions.inject = 'body';              // js 文件注入到 body 中
                        htmlWebpackPluginInstance.userOptions.scriptLoading = 'blocking';   // 阻塞执行
                        htmlWebpackPluginInstance.userOptions.chunks = ['main'];
                    }
                }
                webpackConfig.entry = {
                    main: webpackConfig.entry,
                    background: './src/background.js'
                }
                webpackConfig.output = {
                    ...webpackConfig.output,
                    filename: 'static/js/[name].js',
                }
                console.log(webpackConfig)
                return webpackConfig;
            },
        },
    };
};
```



## 参考内容

1. https://developer.chrome.com/docs/extensions/mv3/
2. https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions
