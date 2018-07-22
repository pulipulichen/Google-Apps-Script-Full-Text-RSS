/**
 * @author Pulipuli Chen 20180722
 * https://script.google.com/d/14ZpRNJ5er0ha-4954gUa3NCgBR9APiEuaW-C9nrWCzhaaeQWraxcn_Y-/edit?splash=yes
 */

CONFIG = {
    feed_url: "http://www.eprice.com.tw/news/rss.xml",
    //image_url: "http://img.eprice.com.tw/img/tw/common/header/logo.filpboard.png",
    //langauge: 'zh-TW',
    limit: 5,
    title: {
        fetch: false,
        filter: function (title, link) {
            return title;
        }
    },
    author: {
        fetch: false,
        exclude_list: [
            "活動小組(eprice_sp)"
        ],
        filter: function (author, link) {
            return author;
        }
    },
    description: {
        fetch: true,
        filter: function (description, link) {
            
            //var _header = '<div class="user-comment-block"  itemprop="description">';
            var _header = '<div class="user-comment-block"';
            //var _footer = '<div class="signature">http://www.eprice.com.tw 最新最快的資訊都在 ePrice 比價王！</div>';
            var _footer = '<div class="signature">';
            description = searchNeedle(description, _header, _footer)[0];
            if (description === undefined) {
                throw "description parsing error: " + link;
            }
            description = remove_prefix(description, 'itemprop="description">');
            
            description = description.split('.tmp" data-original="').join('" data-original-tmp="');
            
            description = remove_scripts(description).trim();
            description = remove_nbsp(description).trim();
            
            // 先刪去最後的div
            while (ends_with(description, '</div>')) {
                description = remove_suffix(description, '</div>').trim();
            }
            
            // 刪去最後的br
            while (ends_with(description, '<br />')) {
                description = remove_suffix(description, '<br />').trim();
            }
            
            return description;
        }
    }
};

function doGet(e) {
    var redirect = e.parameter.redirect;
    if (redirect !== undefined) {
        redirect = decodeURIComponent(redirect);
        //return HtmlService.createHtmlOutput(
        //"<form action='" + redirect + "' method='get' id='foo'></form>" + 
        //"<script>document.getElementById('foo').submit();</script>");
        //return;
        return HtmlService.createHtmlOutput("<script>location.href='" + redirect + "';</script>");
    }

    // ------------------------

    var rss = makeRss();

    var atomLink = ScriptApp.getService().getUrl();
    rss.setAtomlink(atomLink);

    var _rss_data = parse_rss(CONFIG.feed_url);
    
    // -------------------------------
    // channel的部分
    
    if (typeof(_rss_data.channel.title) === "string") {
        rss.setTitle(_rss_data.channel.title);
    }
    if (typeof(_rss_data.channel.link) === "string") {
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
        if (typeof(_image.url) === "undefined" && typeof(CONFIG.image_url) === "string") {
            _image.url = CONFIG.image_url;
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
                    _full_text = UrlFetchApp.fetch(_item.link).getContentText();
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

    return ContentService.createTextOutput(rss.toString())
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
    var _output = [];
    var _parts = text.split(header);
    for (var _i = 1; _i < _parts.length; _i++) {
        var _part = _parts[_i].trim();
        if (footer !== undefined) {
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
    if (_original_rss.indexOf(_channel_header) === -1 || _original_rss.indexOf(_channel_footer) === -1) {
        return;
    }
    
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

var ends_with = function (_str, _needle) {
    if (typeof(_str) !== "string") {
        return false;
    }
    return (_str.lastIndexOf(_needle) === _str.length - _needle.length);
};