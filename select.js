javascript:window.s7ng6n = {};
s7ng6n.loadScript = function (url, callback) {
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.src = url;

    // Attach handlers for all browsers
    var done = false;
    script.onload = script.onreadystatechange = function() {
        if( !done && ( !this.readyState 
            || this.readyState == "loaded" 
            || this.readyState == "complete") ) {
            done = true;
            // Continue your code
            callback();
            // Handle memory leak in IE
            script.onload = script.onreadystatechange = null;
            head.removeChild( script );
        }
    };
    head.appendChild(script);
};
s7ng6n.selector = function () {
    jQuery('font,:header,div,span,p,article,header,section,q')
    .filter(function () {
        var $this = jQuery(this);
        var $children = $this.children();
        var $childrenWL = $this.children('font,a,b,i,u,strong,em,br,:empty,:header');
        var $childrenA = $this.children('a');
        var text = $this.text().replace(/\s+/g, ' ').replace(/\W+/g, ' ');
        var words = text.match(/\b\w{5,}\b/g); // all words with more than 4 letters
        return ($children.size() === 0 || $children.size() === $childrenWL.size())
                && $childrenA.size() < 3 //not more than 3 links -> no NAVBARS!
                && (words !== null && words.length > 4)}).css({"background-color":"red"});
};
if (window.jQuery) {
    s7ng6n.selector();
} else {
    s7ng6n.loadScript('https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js', s7ng6n.selector);
};
void(0);
