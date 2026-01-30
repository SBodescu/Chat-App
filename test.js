(() => {
    'use strict'

    // BOILERPLATE
    const body = document.getElementsByTagName('body')[0];
    body.innerHTML = '';

    const styleText = `
    *, *:before, *:after {margin: 0; padding: 0; box-sizing: content-box}
    body {background-color:#fafaff;}
    #chatbar {background: #888;bottom: 0;height: 32px; position: fixed; width: 100%}
    .chat-window {background-color: #faebd7;border: 1px solid #777;bottom: 0;height:270px;position: fixed;right: 10px; width: 280px;}
    .chat-window .header {border-bottom: 1px solid #777;padding: 5px}
    .chat-window span {}
    .chat-window .header button {float: right}
    .chat-window .footer {justify-content: space-between;align-self:stretch;border-top: 1px solid #777;bottom: 0;display: flex;height: 32px;position: absolute;width: 100%}
    .chat-window .footer input {border: 0; flex: 1;outline: none;padding: 0 7px}
    .chat-window .footer button {border: 0 none;padding: 0 7px}
    .chat-window .messages {height: calc(270px - 30px - 32px);overflow: auto;padding: 0 5px;}
    .chat-window .messages > div {border: 1px solid #aaa;border-radius: 5px;margin: 5px 0;padding: 0 5px}
    `
    const style = document.createElement('style');
    style.innerText = styleText;
    body.appendChild(style)

    // CHAT CODE BEGIN
    const chatbar = document.createElement('div');
    chatbar.id = 'chatbar';
    body.appendChild(chatbar);

    class PubSub {
        subscriptions = new Map();

        subscribe(name, fn) {
            const events = this.subscriptions.get(name);
            if (!events) {
                this.subscriptions.set(name, [fn]);
                return false;
            }

            events.push(fn);
        }

        publish(name, data) {
            const events = this.subscriptions.get(name);
            if(!events) {
                return false;
            }

            events.forEach(event => event.call(null, data));
        }
    }

    class ServerConnection extends PubSub {
        constructor() {
            super();
            this.socket = new WebSocket('wss://echo.websocket.org');
        }

        listen() {
            this.socket.addEventListener('open', this.#genericHandler.bind(this));  
            this.socket.addEventListener('close', this.#genericHandler.bind(this));
            this.socket.addEventListener('error', this.#genericHandler.bind(this));   
            this.socket.addEventListener('message', this.#message.bind(this));
        }

        send(message) {
            this.socket.send(
                typeof message === 'object'
                ? JSON.stringify(message)
                : message
            )
        }

        #genericHandler(event) {
            console.log('ServerConnection::#genericHandler', event)
        }

        #message(event) {
            console.log('ServerConnection::#message', event)
            let message;
            try {
                message = JSON.parse(event.data);
            } catch (error) {
                message = {id:1, message: event.data}
            }
            
            this.publish('message', message)
        }
    }
    
    class ChatWindow extends PubSub {
        shellTemplate = `<div class="chat-window" id="{{id}}">
            <div class="header"><span>{{username}}<span><button>X</button></div>
            <div class="messages">{{messages}}</div>
            <div class="footer">
                <input type="text" name="message" autocomplete="off">
                <button>Send</button>
            </div>
        </div>`
        messageTemplate = `<div>{{message}}</div>`
        messages = '';
        #dom = null;

        constructor(id, username, parent) {
            super();
            
            this.id = id;
            this.username = username;
            this.parent = parent;

            this.#build();
        }

        #build() {
            const dom = document.createElement('div');
            dom.innerHTML = this.shellTemplate
                .replace('{{id}}', this.id)
                .replace('{{username}}', this.username)
                .replace('{{messages}}', this.messages);
            
            this.#dom = dom.firstChild;
        }

        getDom() {
            return this.#dom;
        }
        handleKeypress(event) {
            if (event.code === 'Enter') {
                this.handleClick(event);
            }
        }
        handleClick(event) {
            const message = this.input.value;

            if (!message.length) {
                return false;
            }

            super.publish('send', {
                id: this.id,
                message
            });

            this.input.value = '';
        }
        show() {
            this.parent.appendChild(this.#dom);

            this.input = this.#dom.querySelector('input');
            this.sendButton = this.#dom.querySelector('.footer button');
            this.closeButton = this.#dom.querySelector('.header button');
            this.messages = this.#dom.querySelector('.messages');

            this.input.addEventListener('keypress', this.handleKeypress.bind(this), false);
            this.sendButton.addEventListener('click', this.handleClick.bind(this), false);
            this.closeButton.addEventListener('click', this.close.bind(this), false);
        }
        close() {
            this.input.removeEventListener('keypress', this.handleKeypress.bind(this), false);
            this.sendButton.removeEventListener('click', this.handleClick.bind(this), false);
            this.closeButton.removeEventListener('click', this.close.bind(this), false);
            this.parent.removeChild(this.#dom);
        }
        addMessage(message) {
            const dom = this.messageTemplate
                .replace('{{message}}', message);
            this.messages.insertAdjacentHTML('beforeend', dom);
            this.messages.scrollTop = this.messages.scrollHeight;
        }
    }

    class Chat {
        chatWindows = new Map();
        connection = null;

        constructor(id) {
            this.chatbar = document.getElementById('chatbar');
            this.connection = new ServerConnection();
            this.connection.listen();
            this.connection.subscribe('message', this.receiveMessage.bind(this));
        }

        receiveMessage(inputMessage) {
            const {id, message} = inputMessage;
            let chatWindow = this.chatWindows.get(id);

            if (!chatWindow) {
                chatWindow = new ChatWindow(id, 'test', this.chatbar);
                chatWindow.show();
                this.chatWindows.set(id, chatWindow);
                chatWindow.subscribe('send', this.sendMessage.bind(this));
            }

            chatWindow.addMessage(message);
        }

         sendMessage(message) {
             // todo send message
             console.log('sending message', message);
             this.connection.send(message);
         }
    }
    const chat = new Chat();
    chat.receiveMessage({
        id: 1, message: 'test message'
    })
    
})()