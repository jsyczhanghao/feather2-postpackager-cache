(function(){

if(!window.indexedDB || !window.fetch){
    return false;
}

var indexdb;

function connection(){
    return new Promise(function(resolve){
        var request = window.indexedDB.open('_native', 2);

        request.onsuccess = function(e){
            var transaction = e.target.result.transaction(['resources'], 'readwrite');
            resolve(transaction.objectStore('resources'));
        };

        request.onupgradeneeded = function(event) {
            // 创建一个对象存储空间来持有有关我们客户的信息。
            // 我们将使用 "ssn" 作为我们的 key path 因为它保证是唯一的。
            event.target.result.createObjectStore('resources', {keyPath: 'url'});
        };
    });
}

function trimRandomUrl(url){
    if(/\w{32}\.js\?__random/.test(url)){
        url = url.replace(/\?__.*/, '');
    }

    return url;  
}

function load(url, notTry){
    return new Promise(function(resolve, reject){
        connection().then(function(objectStore){
            var request = objectStore.get(url);

            request.onsuccess = function(){
                if(request.result){
                    resolve(request.result.text);
                }else if(!notTry){
                    try{
                        fetch(url).then(
                            function(res){
                                res.text().then(function(text){
                                    connection().then(function(objectStore){
                                        url = trimRandomUrl(url);
                                        objectStore.put({url, text});
                                        resolve(text);
                                    });
                                }, function(){
                                  reject();
                                })
                            }, 

                            function(){
                                var tryUrl = trimRandomUrl(url);

                                if(tryUrl != url){
                                  resolve(load(tryUrl, true));
                                }else{
                                  reject();
                                }
                            }
                        );  
                    }catch(e){}   
                }else{
                  reject();
                }
            };
        });
    });
};

define.Module.createElement = function(url){
    var isCss = /\.(?:css|less)(?:\?|$)/.test(url), type = isCss ? 'style' : 'script';
    var element = document.createElement(type);
    
    //支持css加载
    if(isCss){
        element.type = 'text/css';
    }else{
        element.type = 'text/javascript';
        element.charset = define.Module.require.config('charset');
    }

    return element;
};

define.Module.load = function(url, callback){
    var element = define.Module.createElement(url);
    
    load(url).then(function(text){
        var text = document.createTextNode(text);
        element.appendChild(text);
        document.getElementsByTagName('head')[0].appendChild(element);
        callback();
        element = null;
    }, function(){
        element.onerror && element.onerror.call(element);
    });
}
})();