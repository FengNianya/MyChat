window.onload = function() {
    //实例并初始化我们的hichat程序
    var hichat = new HiChat();
    hichat.init();
};

//定义我们的hichat类
var HiChat = function() {
    this.socket = null;
};

//向原型添加业务方法
HiChat.prototype = {
    init: function() {//此方法初始化程序
        var that = this;
        //建立到服务器的socket连接
        this.socket = io.connect();
        //监听socket的connect事件，此事件表示连接已经建立
        this.socket.on('connect', function() {
            //连接到服务器后，显示昵称输入框
            document.getElementById('info').textContent = 'get yourself a nickname :)';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();

            document.getElementById(newFunction()).addEventListener('click', function() {
                var messageInput = document.getElementById('messageInput'),
                    msg = messageInput.value;
                messageInput.value = '';
                messageInput.focus();
                if (msg.trim().length != 0) {
                    that.socket.emit('postMsg', msg); //把消息发送到服务器
                    that._displayNewMsg('me', msg); //把自己的消息显示到自己的窗口中
                };
            }, false)
        });

            //昵称设置的确定按钮
        document.getElementById('loginBtn').addEventListener('click', function() {
         var nickName = document.getElementById('nicknameInput').value;
         //检查昵称输入框是否为空
             if (nickName.trim().length != 0) {
                //不为空，则发起一个login事件并将输入的昵称发送到服务器
             that.socket.emit('login', nickName);
             } else {
                   //否则输入框获得焦点
                  document.getElementById('nicknameInput').focus();
             };
        }, false);
        // 判断接收到的昵称是否已经存在在users中，如果存在，则向自己发送一个nickExisted事件，在前端接收到这个事件后我们显示一条信息通知用户。
        this.socket.on('nickExisted', function() {
            document.getElementById('info').textContent = '!nickname is taken, choose another pls'; //显示昵称被占用的提示
        });

        // 向自己发送一个loginSuccess事件，通知前端登陆成功，前端接收到这个成功消息后将灰色遮罩层移除显示聊天界面。
        this.socket.on('loginSuccess', function() {
            document.title = 'hichat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';//隐藏遮罩层显聊天界面
            document.getElementById('messageInput').focus();//让消息输入框获得焦点
        });

        this.socket.on('system', function(nickName, userCount, type) {
            //判断用户是连接还是离开以显示不同的信息
            var msg = nickName + (type == 'login' ? ' joined' : ' left');
            //指定系统消息显示为红色
            that._displayNewMsg('system ', msg, 'red');
            document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' user') + ' online';
        });
        // 在客户端接收服务器发送的newMsg事件，并将聊天消息显示到页面。
        this.socket.on('newMsg', function(user, msg) {
            that._displayNewMsg(user, msg);
        });

        // 一但用户选择了图片，便显示到自己的屏幕上同时读取为文本发送到服务器

        document.getElementById('sendImage').addEventListener('change', function() {
            //检查是否有文件被选中
             if (this.files.length != 0) {
                //获取文件并用FileReader进行读取
                 var file = this.files[0],
                     reader = new FileReader();
                 if (!reader) {
                     that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
                     this.value = '';
                     return;
                 };
                 reader.onload = function(e) {
                    //读取成功，显示到页面并发送到服务器
                     this.value = '';
                     that.socket.emit('img', e.target.result);
                     that._displayImage('me', e.target.result);
                 };
                 reader.readAsDataURL(file);
             };
         }, false);
        //  同时向hichat.js的init方法添加以下代码以接收显示图片。
         this.socket.on('newImg', function(user, img) {
            that._displayImage(user, img);
        });       
        
        document.getElementById('sendBtn').addEventListener('click', function() {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                //获取颜色值
                color = document.getElementById('colorStyle').value;
            messageInput.value = '';
            messageInput.focus();
            if (msg.trim().length != 0) {
                //显示和发送时带上颜色值参数
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('me', msg, color);
            };
        }, false);
        // 按回车键就可以登陆，进入聊天界面后，回车键可以发送消息
        document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
                var nickName = document.getElementById('nicknameInput').value;
                if (nickName.trim().length != 0) {
                    that.socket.emit('login', nickName);
                };
            };
        }, false);
        document.getElementById('messageInput').addEventListener('keyup', function(e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            if (e.keyCode == 13 && msg.trim().length != 0) {
                messageInput.value = '';
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('me', msg, color);
            };
        }, false);
       
    },

    _displayNewMsg: function(user, msg, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            // substr() 的参数指定的是子串的开始位置和长度
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },

    _displayImage: function(user, imgData, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    }

    
};
function newFunction() {
    return 'sendBtn';
}

    
