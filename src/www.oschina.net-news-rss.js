/**
 * @author Pulipuli Chen 20180722
 * https://script.google.com/d/1niRFLoU-GCachOEZLXDJAMcAXPoC5gCtwIuQ7XJPYEF1r4_RX0YnL5Lv/edit
 * 
 * For test: https://script.google.com/macros/s/AKfycbx9b-BAk-Skw2zBBKEFWTon4iOldrKy7IBA51p6g1s/dev
 * 
 * RSS_LIB: MApiMsKOda8tkYBUGtf79u-fsV96KBLp6
 */

CONFIG = {
    //cache_enable: false,
    feed_url: "https://www.oschina.net/news/rss",
    //site_url: "https://www.ptt.cc/bbs/Hearthstone/index.html",
    //image_url: "https://lh3.googleusercontent.com/-k2Xxx7EmyGw/W1SUIviPS7I/AAAAAAADySg/WNpAKLKXz282Td-WdKQr0_VYbAjn2LfeQCHMYCw/s0/2018-07-22_22-26-01.png",
    //langauge: 'zh-TW',
    parse_feed: function (_html) {
        return RSS_LIB.parse_rss_v2(_html);
    },
    limit: 10,
    title: {
        fetch: false,
        filter: function (title, link) {
            return title;
        }
    },
    author: {
        fetch: true,
        exclude_list: [],
        filter: function (author, link) {
            if (RSS_LIB.starts_with(link,'https://www.oschina.net/p/')) {
                if (author.indexOf('<label class="text-green">软件作者:</label>') > -1) {
                    author = RSS_LIB.searchNeedle(author, '<label class="text-green">软件作者:</label>', '</a>')[0];
                    author = RSS_LIB.searchNeedle(author, '>')[0];
                }
                else {
                    author = "";
                }
            }
            else if (RSS_LIB.starts_with(link,'https://www.oschina.net/translate/')) {
                var _authors = RSS_LIB.searchNeedle(author, '<span class="translator-user">', '</span>');
                var _authors_array = [];
                for (var _i = 0; _i < _authors.length; _i++) {
                    _authors_array.push(RSS_LIB.searchNeedle(_authors[_i], "target='_blank'>", '</a>')[0]);
                }
                author = _authors_array.join(", ");
            }
            else if (RSS_LIB.starts_with(link,'https://gitee.com/')) {
                author = RSS_LIB.searchNeedle(link, "https://gitee.com/", '/')[0];
            }
            else if (RSS_LIB.starts_with(link,'https://my.oschina.net/')) {
                author = RSS_LIB.searchNeedle(author, '<div class="osc-avatar small-portrait _35x35 avatar" title="', '" data-user-id="')[0];
            }
            else if (RSS_LIB.starts_with(link,'https://www.oschina.net/news/')) {
                //author = RSS_LIB.searchNeedle(author, '" class="mr green">', '</a>')[0];
                var $ = RSS_LIB.$body(author);
                author = $('.__user .osc-avatar').attr("title");
            }
            return author;
        }
    },
    description: {
        fetch: true,
        filter: function (description, link) {
            var cache = CacheService.getScriptCache();
            
            if (RSS_LIB.starts_with(link,'https://www.oschina.net/p/')) {
                description = RSS_LIB.searchNeedle(description, '<div class="detail editor-viewer all" v-pre>', '<div name="www_project_detail_content_button"')[0];
                while(RSS_LIB.ends_with(description, '</div>')) {
                    description = RSS_LIB.remove_suffix(description, '</div>').trim();
                }
            }
            else if (RSS_LIB.starts_with(link,'https://www.oschina.net/translate/')) {
                // https://www.oschina.net/translate/evolution-of-windows-command-line
                var _parse_description = function (_description) {
                    //return _description;
                    
                    //_description = searchNeedle(_description, '<div class="box paragraph-container">', '<div class="paging">')[0];
                    var _content_parts = RSS_LIB.searchNeedle(_description, '<div class="content">', '<div class="translator-info">');
                    for (var _i = 0; _i < _content_parts.length; _i++) {
                        while(RSS_LIB.ends_with(_content_parts[_i], '</div>')) {
                            _content_parts[_i] = RSS_LIB.remove_suffix(_content_parts[_i], '</div>').trim();
                        }
                    }
                    //return _description;
                    /*
                    if (_description.lastIndexOf('<div class="paging">') > 0) {
                        _description = _description.substr(0, _description.lastIndexOf('<div class="paging">')).trim();
                    }
                    while(ends_with(_description, '</div>')) {
                        _description = remove_suffix(_description, '</div>').trim();
                    }
                    */
                   _description = _content_parts.join("");
                    return _description;
                };
                
                var _get_next_page = function (_description) {
                    var _needle = '<li class=\'page next\'><a href="';
                    if (_description.indexOf(_needle) > -1) {
                        var _href = RSS_LIB.searchNeedle(_description, _needle, '">&gt;</a>')[0];
                        var _page_link = link;
                        if (_page_link.lastIndexOf("?") > 0) {
                            _page_link = _page_link.substr(0, _page_link.lastIndexOf("?"));
                        }
                        _page_link = _page_link + _href;
                        return _page_link;
                    }
                    else {
                        return false;
                    }
                };
                
                var _results = [];
                //var _page_link = link + '?lang=chs&page=1';
                var _page_link = false;
                do {
                    if (_page_link !== false) {
                        description = RSS_LIB.fetch_url(_page_link);
                    }
                    
                    _results.push(_parse_description(description));
                    _page_link = _get_next_page(description);
                    //break;
                    if (_page_link !== false) {
                        _results.push('<hr />');
                    }
                }
                while (_page_link !== false);
                
                //description = _parse_description(description);
                // 取得下一頁
                
                description = _results.join("");
            }
            else if (RSS_LIB.starts_with(link,'https://gitee.com/')) {
                description = RSS_LIB.searchNeedle(description, "<div class='file_content markdown-body'>", '<script>')[0];
                while(RSS_LIB.ends_with(description, '</div>')) {
                    description = RSS_LIB.remove_suffix(description, '</div>').trim();
                }
            }
            else if (RSS_LIB.starts_with(link,'https://my.oschina.net/')) {
                // https://my.oschina.net/u/3413999/blog/1855035
                //description = RSS_LIB.searchNeedle(description, '<div class="content" id="articleContent">', '&copy; 著作权归作者所有')[0];
                //description = description.substring(description.indexOf('</div>')+6, description.lastIndexOf('<div class="ad-wrap">')).trim();
                
                var $ = RSS_LIB.$body(description);
                $(".ad-wrap").remove();
                description = $('.article-detail').html();
            }
            else if (RSS_LIB.starts_with(link,'https://www.oschina.net/news/')) {
                // https://www.oschina.net/news/98236/announce-data-transfer-project
                //description = RSS_LIB.searchNeedle(description, '<div class="editor-viewer text clear">', '<div class="news_detai_down_ad">')[0];
                //description = description.substring(description.indexOf('</div>')+6, description.length).trim();
                
                /*
                var _needle = '<!-- 广告2.0  -->';
                description = description.substring(description.indexOf(_needle) + _needle.length, description.lastIndexOf(_needle)).trim();
                
                description = RSS_LIB.remove_scripts(description);
                
                var $ = RSS_LIB.$(description);
                $('.news_detai_above_ad').remove();
                description = $("body").html();
                */
                var $ = RSS_LIB.$body(description);
                $(".ad-wrap").remove();
                description = $('#articleContent').html();
            }
            return description;
        }
    }
};

// -------------------------------------

function doGet(e) {
    return RSS_LIB.doGet(CONFIG, e);
}
