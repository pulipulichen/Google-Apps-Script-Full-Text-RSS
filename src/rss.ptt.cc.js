/**
 * @author Pulipuli Chen 20180728
 * https://script.google.com/macros/d/1k1ZWPgvYBhxJpB1DXl0XyqU2-Bv7xhA9LuWu5pcQtghT7ZaF8hkBiZUg/edit?splash=yes&splash=yes
 * 
 * https://script.google.com/macros/s/AKfycbzAaM08-g2sTJO51WGdesc0I630-4oweSwKlNaEQy_qjrIOkkqb/exec?board=MabinogiHero
 * https://script.google.com/macros/s/AKfycbzAaM08-g2sTJO51WGdesc0I630-4oweSwKlNaEQy_qjrIOkkqb/exec?board=PokemonGo
 * 
 * https://script.google.com/macros/s/AKfycbzD5Gb0AvRiFmUQQbGuUzzELz14ot0WrGl5B0lOGTaH/dev
 * 
 * RSS_LIB: MApiMsKOda8tkYBUGtf79u-fsV96KBLp6
 */

CONFIG = {
    //cache_enable: false,
    feed_url: function (e) {
        if (typeof(e.parameter.board) === "undefined") {
            return "http://rss.ptt.cc/Hearthstone.xml";
        }
        return "http://rss.ptt.cc/" + e.parameter.board + ".xml";
    },
    site_link: function (e) {
        if (typeof(e.parameter.board) === "undefined") {
            return "https://www.ptt.cc/bbs/Hearthstone/index.html";
        }
        return "https://www.ptt.cc/bbs/" + e.parameter.board + "/index.html";
    },
    image_url: "https://lh3.googleusercontent.com/-k2Xxx7EmyGw/W1SUIviPS7I/AAAAAAADySg/WNpAKLKXz282Td-WdKQr0_VYbAjn2LfeQCHMYCw/s0/2018-07-22_22-26-01.png",
    limit: 5,
    parse_feed: function (_html) {
        return RSS_LIB.parse_rss_atom(_html);
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
    description: {
        fetch: true,
        filter: function (description, link) {
            var _meta_tag_parts = description.split('</span><span class="article-meta-value">');
            var _last_meta_tag_part = _meta_tag_parts[(_meta_tag_parts.length-1)];
            
            var _needle_header = '</span></div>';
            var _needle_footer = '<span class="f2">※ 發信站: 批踢踢實業坊(ptt.cc), 來自:';
            description = _last_meta_tag_part.substring(_last_meta_tag_part.indexOf(_needle_header) + _needle_header.length
                    , _last_meta_tag_part.indexOf(_needle_footer)).trim();
                    
            description = RSS_LIB.parse_image(description);
                    
            description = RSS_LIB.remove_suffix(description, '--').trim();
                    
            description = '<pre>' + description + '</pre>';
            return description;
        }
    }
};

// -------------------------------------

function doGet(e) {
    return RSS_LIB.doGet(CONFIG, e);
}
