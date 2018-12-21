# nem-telegram-bot
A Telegram chat bot that fetches and broadcasts the price of XEM

## Installation
```
npm install
```

## Usage
Run the `main.js` script as a background process. For example, by using Node.js Process Manager (PM2):
```
npm install --global pm2
pm2 start main.js --name "nembot"
```

__Important notes:__  
[Bugfix: #319](https://github.com/yagop/node-telegram-bot-api/issues/319)

#### License
Dual licensed under the MIT and LGPL licenses:

- [MIT License](LICENSE-MIT) (https://opensource.org/licenses/MIT)
- [GNU GPL v3.0](LICENSE-GPL3) (https://www.gnu.org/licenses/gpl.html)
