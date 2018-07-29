/**
 * forum.gamer.com.tw
 * 
 * @author Pulipuli Chen 20180728
 * https://script.google.com/macros/d/1AmJPDivqhLx1Rhl08B9PovcQVmQZ3x-2pYq1_6q9BRaErU-AFlh1JBxC/edit?splash=yes&splash=yes&splash=yes&splash=yes&splash=yes
 * 
 * https://script.google.com/macros/s/AKfycbzAaM08-g2sTJO51WGdesc0I630-4oweSwKlNaEQy_qjrIOkkqb/exec?board=MabinogiHero
 * https://script.google.com/macros/s/AKfycbzAaM08-g2sTJO51WGdesc0I630-4oweSwKlNaEQy_qjrIOkkqb/exec?board=PokemonGo
 * 
 * For test: https://script.google.com/macros/s/AKfycbxTe4deXLacIgtPs1AJp65EsSgR0XcpchdXUwwa_06_/dev
 * 
 * RSS_LIB: MApiMsKOda8tkYBUGtf79u-fsV96KBLp6
 */

CONFIG = {
    cache_enable: false,
    feed_url: function (e) {
        var _bsn = e.parameter.bsn;
        if (typeof(_bsn) === "undefined") {
            _bsn = 24044;
        }
        return "https://forum.gamer.com.tw/B.php?bsn=" + _bsn + "&subbsn=0";
    },
    site_link: function (e) {
        var _bsn = e.parameter.bsn;
        if (typeof(_bsn) === "undefined") {
            _bsn = 24044;
        }
        return "https://forum.gamer.com.tw/B.php?bsn=" + _bsn + "&subbsn=0";
    },
    //image_url: "https://lh3.googleusercontent.com/-k2Xxx7EmyGw/W1SUIviPS7I/AAAAAAADySg/WNpAKLKXz282Td-WdKQr0_VYbAjn2LfeQCHMYCw/s0/2018-07-22_22-26-01.png",
    limit: 1,
    parse_feed: function (_html, _feed_url) {
        var $ = RSS_LIB.$(_html);
        
        // -------------------
        
        var _channel_data = {};
        
        _channel_data.title = $('title').text();
        _channel_data.link = _feed_url;
        
        // -------------------
        var _items_data = [];
        $("tr.b-list__row:not(.b-list__row--sticky):not(.b-list__row--delete)").each(function (_i, _item) {
            var _item_part = RSS_LIB.$(_item);
            var _data = {};
            
            _data.title = _item_part(".b-list__main__title").text().trim();
            _data.author = _item_part(".b-list__count__user a").text().trim();
            _data.link = "https://forum.gamer.com.tw/" + decodeURIComponent(_item_part("a.b-list__main__title").attr("href"));
            //_data.pubDate = "";
            //_data.description = "";
            
            _items_data.push(_data); 
        });
        
        //throw JSON.stringify(_items_data);
        
        return {
            channel: _channel_data,
            item: _items_data
        };
    },
    title: {
        fetch: false,
        filter: function (title, link) {
            return title;
        }
    },
    author: {
        fetch: false,
        exclude_list: [],
        filter: function (author, link) {
            return author;
        }
    },
    pubDate: {
        fetch: true,
        filter: function (_html, link) {
            // 2018-05-29 14:52:56
            // Sun, 22 Jul 2018 10:15:15 +0800
            
            var $ = RSS_LIB.$body(_html);
            var _date_string = $("a.tippy-post-info").attr('data-mtime');
            
            var _date_string = "2018-05-29 14:52:56";
            var _parts = _date_string.split(" ");
            var _yyyymmdd = _parts[0].split("-");
            var _hhmmss = _parts[1].split(":");
            var _date = new Date(_yyyymmdd[0], _yyyymmdd[1]-1, _yyyymmdd[2], _hhmmss[0], _hhmmss[1], _hhmmss[2]);
            //_date.toLocaleString('zh-TW', { timeZone: 'GMT' })
            //_date_string = (new Date(_date_string));
            //throw _date.getFullYear();
            return _date;
            //return RSS_LIB.searchNeedle(_html, '" data-mtime="', '" data-area="C">')[0];
        }
    },
    description: {
        fetch: true,
        filter: function (description, link) {
            var $ = RSS_LIB.$body(description);
            var _article = $('.c-post__body > article').children();
            description = _article.html();
            description = description.split('<img class="lazyload" data-src="').join('<img class="lazyload" src="');
            return description;
        }
    }
};

// -------------------------------------

function doGet(e) {
    return RSS_LIB.doGet(CONFIG, e);
}
