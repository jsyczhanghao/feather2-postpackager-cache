'use strict';

var INLINE = feather.util.read(__dirname + '/native.js');

module.exports = function(ret){
    var files = feather.util.merge(feather.util.merge({}, ret.src), ret.pkg);
    var uriMap = {};

    feather.util.map(files, function(subpath, file){
        uriMap[file.getUrl()] = file;
    });

    feather.util.map(files, function(subpath, file){
        if(file.isCssLike){
            var content = file.getContent().replace(/url\(['"]?(.*?)(\?.*?)?['"]?\)/g, function(all, url){
                var file = uriMap[url];
                
                if(file){
                    return 'url(' + file.getBase64() + ')';
                }

                return all;
            });

            file.setContent(content);
        }else if(file.isHtmlLike){
            var content = file.getContent().replace('<body>', '<script>' + INLINE + '</script><body>');
            file.setContent(content);
        }
    });
};