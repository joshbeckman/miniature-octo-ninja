// Init scrollers
(function(window, document){
  var scrollers = document.getElementsByClassName('scroller'),
    length = scrollers.length,
    i = 0;
  function makeScroller(scrollToPath) {
    return function(){
      var path = scrollToPath;
      scrollTo(window, document.getElementById(path).offsetTop, 1000);
      window.history.pushState({path: path}, ('bbbench ' + path), '/#' + path);
    };
  }
  for (; i < length; i++) {
    scrollers[i].onclick = makeScroller(scrollers[i].dataset.scrollTo);
  }
})(this, this.document);

// Init activators
(function(window, document){
  var revealers = document.getElementsByClassName('activator'),
    length = revealers.length,
    i = 0;
  function makeRevealer() {
    var elems = document.getElementsByClassName(this.dataset.activate),
      deacts = document.getElementsByClassName(this.dataset.deactivate);
    for (var i = 0; i < elems.length; i++) {
      classie.toggle(elems[i], 'active');
    }
    for (i = 0; i < deacts.length; i++) {
      classie.toggle(deacts[i], 'active');
    }
  }
  for (; i < length; i++) {
    revealers[i].addEventListener('click', makeRevealer, false);
  }
})(this, this.document);

// Init toggle-btns
(function(window, document){
  var btns = document.getElementsByClassName('toggle-btn'),
    length = btns.length,
    i = 0;
  for (; i < length; i++) {
    btns[i].addEventListener('click', toggleActives, false);
  }
  function toggleActives(){
    for(var j = 0; j < length; j++){
      classie.toggle(btns[j].parentNode, 'active');
    }
  }
})(this, this.document);

function dismissAlert(elem){
  elem.innerHTML = '';
  document.getElementById('messages').style.display = 'none';
}

// Set up sockets
if (window.io) {
  window.socket = io.connect(window.location.hostname);
}