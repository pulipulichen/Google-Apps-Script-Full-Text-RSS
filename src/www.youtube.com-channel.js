/**
 * @author Pulipuli Chen 20180723
 * https://script.google.com/macros/d/1GjFxz1LEPehdFDl3BharWCrkY4lzJquKDstbyR8sIp4V6lu5PKVZQ0UI/edit?splash=yes&splash=yes&splash=yes&splash=yes&splash=yes
 * 
 * Library: MApiMsKOda8tkYBUGtf79u-fsV96KBLp6
 */

CONFIG = {
    feed_url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCbr1TwV0Tk7LeQ5Yzi0vRxA",
    image_url: function (_feed_url) {
        
        // http://www.youtube.com/feeds/videos.xml?channel_id=UCbr1TwV0Tk7LeQ5Yzi0vRxA
        // https://www.youtube.com/channel/UCbr1TwV0Tk7LeQ5Yzi0vRxA
        var _needle = "?channel_id=";
        var _channel_id = _feed_url.substring(_feed_url.lastIndexOf(_needle) + _needle.length, _feed_url.length);
        var _channel_link = "https://www.youtube.com/channel/" + _channel_id + "?t=201807231457";
        //return _channel_link;
        //return RSS_LIB.fetch_url(_channel_link);
        
        var _html = RSS_LIB.fetch_url(_channel_link);
        //return _html;
        return RSS_LIB.searchNeedle(_html, '<img class="appbar-nav-avatar" src="', '" title="')[0];
        //var _needle_footer = '/photo.jpg">';
        //_html = _html.substring(0, _html.indexOf(_needle_footer));
        //var _needle_header = '<img src="';
        //_html = _html.substring(_html.lastIndexOf(_needle_header) + _needle_header.length, _html.length);
        //return _html + '/photo.jpg';
        //return _feed_url;
    },
    parse_feed: function (_html) {
        return RSS_LIB.parse_rss_atom(_html);
    },
    //limit: 2,
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
    description: {
        fetch: false,
        filter: function (description, link) {
            description = "<pre>" + description + "</pre>";
            description = '<iframe width="560" height="315" src="' + link + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>' + description;            
            return description;
        }
    }
};

// -------------------------------------

function doGet(e) {
    return RSS_LIB.doGet(CONFIG, e);
}
