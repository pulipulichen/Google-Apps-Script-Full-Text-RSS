/**
 * @author Pulipuli Chen 20180723 00:47
 * https://script.google.com/macros/d/176AMATTEe2lRMtydLisuxDlRsWrkVrj2v3HLRwc-w1QtcZhXFXBDg7B6/edit?splash=yes&splash=yes&splash=yes&splash=yes
 * 
 * Library: MApiMsKOda8tkYBUGtf79u-fsV96KBLp6
 */

CACHE_ENABLE = false;

doGet = function (CONFIG, e) {
    /*
    var redirect = e.parameter.redirect;
    if (redirect !== undefined) {
        redirect = decodeURIComponent(redirect);
        //return HtmlService.createHtmlOutput(
        //"<form action='" + redirect + "' method='get' id='foo'></form>" + 
        //"<script>document.getElementById('foo').submit();</script>");
        //return;
        return HtmlService.createHtmlOutput("<script>location.href='" + redirect + "';</script>");
    }
    */
    if (typeof(CONFIG.feed_url) !== "string" && typeof(e.parameter.feed) === "string") {
        CONFIG.feed_url = decodeURIComponent(e.parameter.feed);
    }
    else if (typeof(CONFIG.feed_url) === "function") {
        CONFIG.feed_url = CONFIG.feed_url(e);
    }
    
    var _rss_cache_key = "rss_cache_key_" + CONFIG.feed_url;
    var _rss_cache = cache_get(_rss_cache_key);
    
    if (_rss_cache !== null) {
        return ContentService.createTextOutput(_rss_cache)
            .setMimeType(ContentService.MimeType.RSS);
    }

    // ------------------------
    //var cache = CacheService.getScriptCache();

    var rss = makeRss();

    var atomLink = ScriptApp.getService().getUrl();
    rss.setAtomlink(atomLink);

    var _original_rss = UrlFetchApp.fetch(CONFIG.feed_url).getContentText();
    var _rss_data = CONFIG.parse_feed(_original_rss);
    
    // -------------------------------
    // channel的部分
    
    if (typeof(_rss_data.channel.title) === "string") {
        if (typeof(CONFIG.feed_title) === "function") {
            _rss_data.channel.title = CONFIG.feed_title(_rss_data.channel.title);
        }
        
        rss.setTitle(_rss_data.channel.title);
    }
    
    if (typeof(CONFIG.site_url) === "string") {
        rss.setLink(redirect_link(CONFIG.site_url));
    }
    else if (typeof(_rss_data.channel.link) === "string") {
        rss.setLink(redirect_link(_rss_data.channel.link));
    }
    if (typeof(_rss_data.channel.description) === "string") {
        rss.setDescription(_rss_data.channel.description);
    }
    if (typeof(_rss_data.channel.language) === "string") {
        rss.setLanguage(_rss_data.channel.language);
    }
    if (typeof(_rss_data.channel.copyright) === "string") {
        rss.setCopyright(_rss_data.channel.copyright);
    }
    if (typeof(_rss_data.channel.image) === "object") {
        var _image = _rss_data.channel.image;
        if (typeof(_image.url) === "undefined" && typeof(CONFIG.image_url) !== "undefined") {
            _image.url = CONFIG.image_url;
            if (typeof(_image.url) === "function") {
                var _image_key = "image_key_" + _rss_data.channel.link;
                var _cache = cache_get(_image_key);
                if (_cache === null) {
                    _image.url = _image.url(CONFIG.feed_url);
                    cache_put(_image_key, _image.url);
                }
                else {
                    _image.url = _cache;
                }
            }
        }
        if (typeof(_image.title) === "undefined" && typeof(_rss_data.channel.title) === "string") {
            _image.title = _rss_data.channel.title;
        }
        if (typeof(_image.link) === "undefined" && typeof(_rss_data.channel.link) === "string") {
            _image.link = _rss_data.channel.link;
        }
        rss.setImage(_image.url, _image.title, _image.link);
    }
    
    // -----------------------------------------------------
    // item的部分
    var _item_added_count = 0;
    for (var _i in _rss_data.item) {
        if (typeof(CONFIG.limit) === "number" && _item_added_count >= CONFIG.limit) {
            break;
        }
        
        var _item = _rss_data.item[_i];
        
        var _full_text = null;
        
        var _get_data = function (_config, _original_value) {
            if (_config.fetch === true) {
                if (_full_text === null && typeof(_item.link) === "string") {
                    _full_text = fetch_url(_item.link);
                }
                _original_value = _full_text;
            }
            
            return _config.filter(_original_value, _item.link);
        };
        
        var _is_excluded = function (_config, _value) {
            return (Array.isArray(_config.exclude_list) && _config.exclude_list.indexOf(_value) > -1);
        };
        
        if (typeof(_item.title) !== "undefined") {
            _item.title = _get_data(CONFIG.title, _item.title);
        }
        if (typeof(_item.author) !== "undefined") {
            _item.author = _get_data(CONFIG.author, _item.author);
            if (_is_excluded(CONFIG.author, _item.author)) {
                continue;
            }
        }
        if (typeof(_item.description) !== "undefined") {
            _item.description = _get_data(CONFIG.description, _item.description);
        }
        
        if (typeof(_item.link) !== "undefined") {
            _item.link = redirect_link(_item.link);
        }
        
        if (typeof(_item.pubDate) !== "undefined") {
            _item.pubDate = formatDate(_item.pubDate);
        }
        
        // -----------------
        
        rss.addItem(_item);
        _item_added_count++;
    }

    var _result = rss.toString();
    cache_put(_rss_cache_key, _result, 180);

    return ContentService.createTextOutput(_result)
            .setMimeType(ContentService.MimeType.RSS);
}

// ------------------------------------------------------------------------------

var makeRss = function () {
    var channel = XmlService.createElement('channel');
    var root = XmlService.createElement('rss')
            .setAttribute('version', '2.0')
            .setAttribute('xmlnsatom', "http://www.w3.org/2005/Atom")
            .addContent(channel);

    var title, link, description, language, atomlink, copyright;
    var image = {};
    var items = {};

    var createElement = function (element, text) {
        if (text === undefined || text === null) {
            throw element +" is undefined";
        }
        return XmlService.createElement(element).setText(text);
    };
    
    var addContent = function (_key, _value) {
        if (_value !== undefined) {
            channel.addContent(createElement(_key, _value));
        }
    };

    return {
        setTitle: function (value) {
            title = value;
        },
        setLink: function (value) {
            link = value;
        },
        setDescription: function (value) {
            description = value;
        },
        setLanguage: function (value) {
            language = value;
        },
        setAtomlink: function (value) {
            atomlink = value;
        },
        setCopyright: function (value) {
            copyright = value;
        },
        setImage: function (_url, _title, _link) {
            image.url = _url;
            image.title = _title;
            image.link = _link;
        },

        addItem: function (args) {
            var item = {};
            
            if (typeof args.title !== 'undefined') {
                item.title = args.title;
            }
            
            if (typeof args.timezone !== 'undefined') {
                args.timezone = "GMT";
            }
            if (!(args.pubDate instanceof Date)) {
                throw 'pubDate Missing! ' + JSON.stringify(item);
            }
            else {
                item.pubDate = Utilities.formatDate(args.pubDate, args.timezone, "EEE, dd MMM yyyy HH:mm:ss Z");
            }
            
            if (typeof args.author !== 'undefined') {
                item.author = args.author;
            }
            if (typeof args.link !== 'undefined') {
                item.link = args.link;
            }
            if (typeof args.description !== 'undefined') {
                item.description = args.description;
            }
            
            if (typeof args.guid === 'undefined' && typeof args.link === 'undefined') {
                throw 'GUID ERROR';
            }
            else {
                item.guid = args.guid === 'undefined' ? args.link : args.link;
            }

            items[item.guid] = item;
        },

        toString: function () {
            channel.addContent(XmlService.createElement("atomlink")
                    .setAttribute('href', atomlink)
                    .setAttribute('rel', 'self')
                    .setAttribute('type', 'application/rss+xml')
                    );

            addContent("title", title);
            addContent("link", link);
            addContent("description", description);
            addContent("language", language);
            addContent("copyright", copyright);
            
            var imageElement = XmlService.createElement('image');
            for (var _key in image) {
                if (typeof(image[_key]) !== "undefined") {
                    imageElement.addContent(createElement(_key, image[_key]));
                }
            }
            channel.addContent(imageElement);
            
            // -----------------------------------
            
            for (var i in items) {
                var itemElement = XmlService.createElement('item');
                
                for (var _key in items[i]) {
                    if (_key === "enclosure") {
                        var _enclosure = items[i][_key];
                        var _enclosure_element = XmlService.createElement(_key);
                        for (var _enclosure_key in _enclosure) {
                            _enclosure_element.setAttribute(_enclosure_key, _enclosure[_enclosure_key]);
                        }
                        itemElement.addContent(_enclosure_element);
                        continue;
                    }
                    
                    itemElement.addContent(createElement(_key, items[i][_key]));
                }
                
                channel.addContent(itemElement);
            }

            var document = XmlService.createDocument(root);
            var xml = XmlService.getPrettyFormat().format(document);

            var result = xml.replace('xmlnsatom', 'xmlns:atom')
                    .replace('<atomlink href=', '<atom:link href=');

            return result;
        }
    };
};

// ----------------------------------------------------

var formatDate = function (dateString) {
    try {
        /*
        var p = /(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/;
        var m = p.exec(dateString);
        var year = m[1];
        var month = m[2];
        var day = m[3];
        var hour = m[4];
        var minute = m[5];
        var second = m[6];
        return new Date(year, month - 1, day, hour, minute, second);
        */
        return new Date(Date.parse(dateString));
    }
    catch (e) {
        throw "dateString format is error: " + dateString;
    }
};

var searchNeedle = function (text, header, footer) {
    if (typeof(text) !== "string") {
        return text;
    }
    
    var _output = [];
    var _parts = text.split(header);
    for (var _i = 1; _i < _parts.length; _i++) {
        var _part = _parts[_i].trim();
        if (footer !== undefined && _part.indexOf(footer) > -1) {
            _part = _part.substring(0, _part.indexOf(footer));
        }
        _output.push(_part);
    }
    return _output;
};

var parse_rss = function (_feed_url) {
    var _original_rss = UrlFetchApp.fetch(_feed_url).getContentText();
    
    
    // ------------------------
    
    var _channel_header = "<channel>";
    var _channel_footer = "</channel>";
    
    var _atom_header = '<feed xmlns="http://www.w3.org/2005/Atom">';
    var _atom_footer = "</feed>";
    
    
    if (_original_rss.indexOf(_channel_header) > -1 && _original_rss.indexOf(_channel_footer) > -1) {
        return parse_rss_v2(_original_rss);
    }
    else if (_original_rss.indexOf(_atom_header) > -1 && _original_rss.indexOf(_atom_header) > -1) {
        return parse_rss_atom(_original_rss);
    } 
    else {
        throw "RSS format error: " + _feed_url;
    }
    
};

var parse_rss_v2 = function (_original_rss) {
    var _channel_header = "<channel>";
    var _channel_footer = "</channel>";
    
    var _channel_xml = _original_rss.substring(_original_rss.indexOf(_channel_header) + _channel_header.length
        , _original_rss.lastIndexOf(_channel_footer)).trim();
    
    var _channel_part = _channel_xml.substr(0, _channel_xml.indexOf("<item>")).trim();
    
    var _channel_data = {};
    
    _channel_data.title = parse_cdata(parse_tag_text(_channel_part, 'title'));
    _channel_data.link = parse_tag_text(_channel_part, 'link');
    _channel_data.description = parse_cdata(parse_tag_text(_channel_part, 'description'));
    _channel_data.language = parse_tag_text(_channel_part, 'language');
    _channel_data.copyright = parse_cdata(parse_tag_text(_channel_part, 'copyright'));
    
    var _image_part = parse_tag_text(_channel_part, 'image');
    _channel_data.image = {};
    _channel_data.image.url = parse_tag_text(_image_part, 'url');
    _channel_data.image.title = parse_cdata(parse_tag_text(_image_part, 'title'));
    _channel_data.image.link = parse_tag_text(_image_part, 'link');
    
    // ------------------------------------------
    
    var _items = searchNeedle(_channel_xml, '<item>', '</item>');
    var _items_data = [];
    
    for (var _i = 0; _i < _items.length; _i++) {
        var _item_part = _items[_i];
        var _data = {};
        _data.title = parse_cdata(parse_tag_text(_item_part, 'title'));
        _data.link = parse_tag_text(_item_part, 'link');
        _data.description = parse_cdata(parse_tag_text(_item_part, 'description'));
        _data.author = parse_cdata(parse_tag_text(_item_part, 'author'));
        _data.pubDate = parse_tag_text(_item_part, 'pubDate');
        
        var _enclosure_header = '<enclosure';
        if (_item_part.indexOf(_enclosure_header) > -1) {
            var _enclosure_data = _item_part.substring(_item_part.indexOf(_enclosure_header), _item_part.length);
            _enclosure_data = _enclosure_data.substring(0, _enclosure_data.indexOf("/>") + 2);
            
            _data.enclosure = {};
            _data.enclosure.url = searchNeedle(_enclosure_data, 'url="', '"')[0];
            _data.enclosure.length = searchNeedle(_enclosure_data, 'length="', '"')[0];
            _data.enclosure.type = searchNeedle(_enclosure_data, 'type="', '"')[0];
        }
        
        _items_data.push(_data);
    }
    
    // -----------------
    
    return {
        channel: _channel_data,
        item: _items_data
    };
};

var parse_rss_atom = function (_original_rss) {
    
    _original_rss = _original_rss.split("<media:group").join("<media_group");
    _original_rss = _original_rss.split("<media:description").join("<media_description");
    _original_rss = _original_rss.split("<media:thumbnail").join("<media_thumbnail");
    
    var _rss = $(_original_rss);
    
    var _channel_data = {};
    
    _channel_data.title = _rss("title").eq(0).text();
    if (_rss("link[rel=alternate]").length > 0) {
        _channel_data.link = _rss("link[rel=alternate]").eq(0).attr("href");
    }
    else {
        _channel_data.link = _rss("link").eq(0).attr("href");
    }
    _channel_data.image = {};
    
    // ------------------------------------------
    
    //var _items = _rss("entry");
    var _items_data = [];
    
    _rss("entry").each(function (_i, _item) {
        var _item_part = $(_item);
        var _data = {};
        _data.title = _item_part("title").text().trim();
        _data.author = _item_part("author > name").text().trim();
        _data.link = _item_part("link").attr("href");
        _data.pubDate = _item_part("published").text().trim();
        
        _data.description = "";
        if (_item_part("content").length > 0) {
            _data.description = _data.description + _item_part("content").text().trim();
        }
        if (_item_part("media_group media_description").length > 0) {
            _data.description = _data.description + _item_part("media_group media_description").text().trim();
        }
        
        if (_item_part("media_group media_thumbnail").length > 0) {
            _data.enclosure = {};
            _data.enclosure.url = _item_part("media_group media_thumbnail").attr("url");
        }
        
        _items_data.push(_data); 
    });
    
    // -----------------
    
    return {
        channel: _channel_data,
        item: _items_data
    };
};

var parse_tag_text = function (_text, _tag_name) {
    var _value = searchNeedle(_text, '<' + _tag_name + '>', '</' + _tag_name + '>')[0];
    if (_value !== undefined) {
        _value = _value.trim();
    }
    return _value;
};

var redirect_link = function (_link) {
    return _link;
    
    var atomLink = ScriptApp.getService().getUrl();
    atomLink = atomLink + "?redirect=" + encodeURIComponent(_link);
    return atomLink;
};

var parse_cdata = function (_text) {
    if (typeof(_text) !== "string") {
        return _text;
    }
    
    _text = _text.trim();
    
    var _needle_header = "<![CDATA[";
    var _needle_footer = "]]>";
    if (_text.indexOf(_needle_header) === 0) {
        _text = _text.substring(_needle_header.length, _text.length);
    }
    
    if (_text.lastIndexOf(_needle_footer) === _text.length - _needle_footer.length) {
        _text = _text.substring(0, _text.length - _needle_footer.length);
    }
    
    return _text;
};

var remove_prefix = function (_str, _needle) {
    if (typeof(_str) !== "string") {
        return _str;
    }
    if (_str.indexOf(_needle) === 0) {
        _str = _str.substring(_needle.length, _str.length);
    }
    return _str;
};

var remove_suffix = function (_str, _needle) {
    if (typeof(_str) !== "string") {
        return _str;
    }
    if (_str.lastIndexOf(_needle) === _str.length - _needle.length) {
        _str = _str.substring(0, _str.length - _needle.length);
    }
    return _str;
};

var remove_scripts = function (_html) {
    if (typeof(_html) !== "string") {
        return _html;
    }
    
    var _output = '';
    var _parts = _html.split("<script");
    for (var _i = 0; _i < _parts.length; _i++) {
        if (_i === 0) {
            _output = _parts[_i];
        }
        else {
            var _part = _parts[_i];
            _part = _part.substring(_part.indexOf("</script>") + 9 , _part.length).trim();
            _output = _output + _part;
        }
    }
    
    return _output;
};

var remove_nbsp = function (_html) {
    if (typeof(_html) !== "string") {
        return _html;
    }
    return _html.split("&nbsp;").join("");
};

var parse_image = function (_html) {
    var _output = "";
    var _needle = '" target="_blank" rel="nofollow">http://i.imgur.com/';
    var _parts = _html.split(_needle);
    for (var _i = 0; _i < _parts.length; _i++) {
        var _part = _parts[_i];
        if (_i === 0) {
            _output = _part;
        }
        else {
            var _img_id = _part.substr(0, _part.indexOf('</a>'));
            var _img_html = '<br /><img src="http://i.imgur.com/' + _img_id + '" />';
            _part = _img_id + _img_html + _part.substring(_part.indexOf('</a>'), _part.length);
            _output = _output + _needle + _part;
        }
    }
    
    // ----------------------------
    _html = _output;
    var _output = "";
    var _needle = '" target="_blank" rel="nofollow">https://pbs.twimg.com/media/';
    var _parts = _html.split(_needle);
    for (var _i = 0; _i < _parts.length; _i++) {
        var _part = _parts[_i];
        if (_i === 0) {
            _output = _part;
        }
        else {
            var _img_id = _part.substr(0, _part.indexOf('</a>'));
            var _img_html = '<br /><img src="https://pbs.twimg.com/media/' + _img_id + '" />';
            _part = _img_id + _img_html + _part.substring(_part.indexOf('</a>'), _part.length);
            _output = _output + _needle + _part;
        }
    }
    
    return _output;
};

var starts_with = function (_str, _needle) {
    if (typeof(_str) !== "string") {
        return false;
    }
    return (_str.indexOf(_needle) === 0);
};

var ends_with = function (_str, _needle) {
    if (typeof(_str) !== "string") {
        return false;
    }
    return (_str.lastIndexOf(_needle) === _str.length - _needle.length);
};


var cache_put = function (_key, _data, _second) {
    if (_second === undefined) {
        _second = 21600;
    }
    
    var cache = CacheService.getScriptCache();
    var _cache_limit = 100000;
    var _split_data = [];
    while (_data.length > _cache_limit) {
        var _d = _data.substr(0, _cache_limit);
        _split_data.push(_d);
        _data = _data.substring(_cache_limit, _data.length);
    }
    _split_data.push(_data);
    
    for (var _i = 0; _i < _split_data.length; _i++) {
        cache.put(cache_key(_i, _key), _split_data[_i], _second);
    }
};

var cache_key = function (_i, _key) {
    var _cache_key = _i + "|" + _key;
    if (_cache_key.length > 100) {
        _cache_key = _cache_key.substr(0, 100);
    }
    return _cache_key;
};

var cache_get = function (_key) {
    if (CACHE_ENABLE === false) {
        return null;
    }
    
    //return null;
    var cache = CacheService.getScriptCache();
    
    var _i = 0;
    var _split_data = [];
    do {
        var _d = cache.get(cache_key(_i, _key));
        if (_i === 0 && _d === null) {
            return null;
        }
        else if (_i > 0 && _d === null) {
            break;
        }
        _split_data.push(_d);
        _i++;
    } while (true);
    
    return _split_data.join("");
};

var cache_remove = function (_key) {
    //return null;
    var cache = CacheService.getScriptCache();
    var _i = 0;
    do {
        var _d = cache.get(cache_key(_i, _key));
        if (_d === null) {
            return;
        }
        else {
            cache.put(cache_key(_i, _key), null);
            return;
        }
        _i++;
    } while (true);
    return;
};

var fetch_url = function (_url, _enable_cache) {
    var _cache = null;
    //cache_remove(_url);
    if (_enable_cache === undefined || _enable_cache === true) {
        _cache = cache_get(_url);
    }
    else {
        cache_remove(_url);
    }
    
    //_cache = null;
    var _output = null;
    if (_cache === null) {
        _output = UrlFetchApp.fetch(_url).getContentText();
        cache_put(_url, _output);
        /*
        if (_enable_cache === undefined || _enable_cache === true) {
            cache_put(_url, _output);
        }
        else {
            cache_remove(_url);
        }
        */
    }
    else {
        _output = _cache;
    }
    return _output;
};

/**
 * 使用說明 https://github.com/cheeriojs/cheerio
 * 
 * https://github.com/asciian/cheeriogs
 */
var $ = function (_html) {
    return Cheerio.load(_html);
};