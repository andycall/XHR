var xhr = (function(){

    var xhr = undefined;

    // 默认的head头
    var configDefault = {
        Get : "text/plain",
        Post : "application/x-www-form-urlencoded",
        PostJson : "application/json"
    };


    function extend(obj, extension){
        for(var key in extension){
            if(extension.hasOwnProperty(key) && !(key in obj)){
                obj[key] = extension[key];
            }
        }
        return obj;
    }


    function XHR(config){
        var config = config || {};
        this.config = extend(config, configDefault);
    }


    // 事件绑定函数
    function on (target, eventName, fn) {
        var factor = /\s+/g;

        var fnString = fn.toString().replace(factor, "");
        if (!target[eventName + "event"]) {
            target[eventName + 'event'] = {};
        }
        target[eventName + 'event'][eventName] = function(e) {
            fn.call(this, e);
        }
        var eventFunc = target[eventName + "event"][eventName];

        if (document.attachEvent) {
            target.attachEvent('on' + eventName, eventFunc);
        } else if (document.addEventListener) {
            target.addEventListener(eventName, eventFunc, false);
        } else {
            target['on' + eventName] = eventFunc;
        }
    };


    // 表单格式转换
    function formEncode(data){
        if(! data) return "";

        var result = [],
            value;

        for(var key in data){
            if(!data.hasOwnProperty(key)) continue;
            if(typeof data === 'function') continue;

            try{
                value = data[key].toString();
            }
            catch(e){

            }

            key = encodeURIComponent(key.replace("%20", "+"));
            value = encodeURIComponent(value.replace("%20", "+"));
            result.push(key + "=" + value);
        }

        return result.join("&");
    }

    // 回调处理
    function handleRequest(callback){
        var type = xhr.getResponseHeader('Content-Type');

        if(type.match(/^text/)){
            callback(xhr.responseText);
        }
        else if(type.indexOf('xml') != -1 && xhr.responseXML){
            callback(xhr.responseXML);
        }
        else if(type === 'application/json'){
            callback(JSON.parse(xhr.responseText));
        }
    }


    /**
     * 初始化, 已整合至setup函数中
     * @returns {xhr}
     */
    XHR.prototype.init = function(){
        if(window.XMLHttpRequest == undefined){
            window.XMLHttpRequest = function(){
                xhr =  new ActiveXObject();
            }
        }
        xhr =  new XMLHttpRequest();

        return this;
    }

    /**
     * GET请求。 默认获取纯文本， 可作为GET表单提交
     */
    XHR.prototype.get = function(url){
        var self = this,
            config = self.config,
            callback,
            data;

        xhr.open("GET", url);

        callback = arguments[1];

        if(arguments.length > 2){
            data = arguments[1];
            callback = arguments[2];
        }  

        // 设置Content-Type头/
        var header = config.Get || "text/plain";

        xhr.setRequestHeader(header);

        on(xhr, 'readystatechange', function(e){
            if(xhr.readyState == 4 && xhr.status == 200){
                var type = xhr.getResponseHeader("Content-Type");
                // 必须是文本
                if(type.match(/^text/)){
                   callback(xhr.responseText);
                }
            }
        });

        if(header == "application/x-www-form-urlencoded"){
            xhr.send(formEncode(data));
        }
        else{
            xhr.send(null);
        }

    }


    /**
     * 使用POST发送JSON格式的数据
     * @param data
     * @param callback
     */
    XHR.prototype.postJSON = function(url, data, callback){
        var self = this,
            config = self.config;

        xhr.open("POST", url);

        var header = config.PostJson || "application/json";

        xhr.setRequestHeader('Content-Type', header);

        on(xhr, 'readystatechange', function(e){
            if(xhr.readyState === 4 && xhr.status === 200){
                handleRequest(callback);
            }
        });

        xhr.send(JSON.stringify(data));

    }

    /**
     * POST表单提交
     * @param data
     * @param callback
     */
    XHR.prototype.post = function(url, data, callback){
        var self = this,
            config = self.config;

        xhr.open("POST", url);

        var header = config.Post || "application/x-www-form-urlencoded";

        xhr.setRequestHeader("Content-Type", header);

        on(xhr, 'readystatechange', function(e){
            if(xhr.readyState == 4 && xhr.status == 200){
                handleRequest(callback);
            }
        });

        xhr.send(formEncode(data));
    }

    XHR.prototype.cors = function(url, data, callback){
        var supportCORS = new XMLHttpRequest().withCredentials == undefined,
            self = this;

        if(supportCORS){
            self.post(url, data, callback);
        }
    }

    XHR.prototype.jsonp = function(url, callback){
        if(url.indexOf("?") == -1){
            url += "?jsonp=" + callback.name;
        }
        else{
            url+= "&jsonp=" + callback.name;
        }

        var script = document.createElement('script');
        script.src = url;
        script.id = callback.name;
        document.body.appendChild(script);
    }

    XHR.setup = function(config){
        return new XHR(config).init();
    }

    return XHR;

})();
