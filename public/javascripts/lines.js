(function(window, document){
  var clientId = '248017327299',
    apiKey = 'AIzaSyA1TucEclEzMXJpeg9wL6ivbwDDbDPXZeU',
    scopes = 'https://www.googleapis.com/auth/analytics.readonly',
    dndCtaTemplate = _.template('</ul><p class="appending-p">Or, you can drag and drop a Stark Lines configuration file anywhere on this page.<br><a href="http://www.bckmn.com/blog/even-starker-lines" target="_blank">You can read more here.</a></p>'),
    profileTemplate = _.template([
        '<div class="pure-u-1-5">',
          '<span class="icon-cross2 close-profile" title="Remove Profile"></span>',
          '<a target="_blank" id="<%= profile %>-link">',
            '<div class="borders" style="border-color:<%= color %>;">',
              '<h2 class="live-name"><%= profileName %></h2>',
            '</div>',
            '<div class="live-counter" style="background-color:<%= color %>;" title="Active visitors">',
              '<span id="<%= profile %>-counter" class="odometer odometer-theme-default">0</span>',
            '</div>',
            '<small class="live-top" id="<%= profile %>-top"></small>',
          '</a>',
        '</div>'
      ].join('')),
    messageTemplate = _.template([
      '<p class="pull-center message">',
        '<a onclick="dismissAlert(this.parentNode.parentNode);" class="dismiss-alert"><span class="icon-cross"></span></a>',
        '<%= message %>',
      '</p>'
      ].join('')),
    errorTemplate = _.template([
      '<p class="pull-center error">',
        '<a onclick="dismissAlert(this.parentNode.parentNode);" class="dismiss-alert"><span class="icon-cross"></span></a>',
        '<%= error %>',
      '</p>'
      ].join('')),
    optionsDiv = document.getElementById('options');

  window.starkLines = {
    data: window.d3.range(30).map(function(){return window.d3.range(60).map(initial);}),
    allData: window.d3.range(30).map(function(){return [];}),
    profileList: [],
    running: false,
    delay: 10000,
    counterList: [],
    runningInterval: null
  };

  window.onload = function() {
    handleClientLoad();
  };

  window.handleClientLoad = function () {
    window.gapi.client.setApiKey(apiKey);
    window.setTimeout(checkAuth,100);
  };

  function checkAuth() {
    // console.log('checking auth')
    window.gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
  }

  function handleAuthResult(authResult) {
    // console.log('handling auth')
    var authorizeButtons = document.getElementsByClassName('authorize-button'),
      i = 0;
    if (authResult && !authResult.error) {
      for (i = authorizeButtons.length - 1; i >= 0; i--) {
        authorizeButtons[i].style.visibility = 'hidden';
      }
      document.getElementById('land').style.display = 'none';
      document.getElementById('sea').style.display = 'inherit';
      progress(0);
      window.gapi.client.load('analytics', 'v3', makeApiCall);
    } else {
      for (i = authorizeButtons.length - 1; i >= 0; i--) {
        authorizeButtons[i].style.visibility = '';
        authorizeButtons[i].addEventListener('click', handleAuthClick, false);
      }
    }
  }

  function handleAuthClick(event) {
    // console.log('manual auth')
    window.gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
    return false;
  }

  function makeApiCall() {
    // console.log('Querying Accounts');
    window.gapi.client.analytics.management.accounts.list().execute(handleAccounts);
  }
  function queryWebProperties(accountId) {
    console.log(accountId);
    progress(33);
    // console.log('Querying Webproperties.');
    window.gapi.client.analytics.management.webproperties.list({'accountId': accountId}).execute(handleWebproperties);
  }
  function queryProfiles(accountId, webPropertyId) {
    console.log(accountId, webPropertyId);
    progress(66);
    // console.log('Querying Views (Profiles).');
    window.gapi.client.analytics.management.profiles.list({
        'accountId': accountId,
        'webPropertyId': webPropertyId
    }).execute(handleProfiles);
  }
  function queryLiveReportingApi(profileId){
    // console.log('Querying Live Reporting API.');
    var liveApiQuery = window.gapi.client.analytics.data.realtime.get({
      'ids': 'ga:' + profileId,
      'metrics': 'rt:activeVisitors',
      'dimensions': 'rt:pageTitle'
    });
    liveApiQuery.execute(handleLiveReportingResults);
  }
  function printResults(results) {
    if (results.rows && results.rows.length) {
      console.log(results);
    } else {
      console.log('No results found for ', results.profileInfo.profileName);
    }
  }
  function readyChoiceLinks(funktion){
    var items = document.getElementsByClassName('appending-list'),
      i = 0;
    for (i = items.length - 1; i >= 0; i--) {
      items[i].addEventListener('click', handleChoice, false);
    }
    function handleChoice(evt){
      if (evt.target.dataset.accountId) {
        funktion(evt.target.dataset.accountId, evt.target.dataset.itemId);
      } else if (evt.target.dataset.profileName) {
        funktion(evt.target.dataset.itemId, evt.target.dataset.profileName);
      } else {
        funktion(evt.target.dataset.itemId);
      }
    }
  }
  function handleAccounts(results) {
    if (!results.code) {
      if (results && results.items && results.items.length) {
        var appendingList = ['<h2 class="upper prompt-header">Choose an account</h2><ul class="appending-list">'];
        for(i=0;i<results.items.length;i++){
          appendingList.push('<li><a class="link-button" data-item-id="'+results.items[i].id+'">'+results.items[i].name+'</a></li>');
        }
        appendingList.push(dndCtaTemplate());
        optionsDiv.innerHTML = appendingList.join('');
        readyChoiceLinks(queryWebProperties);
      } else {
        console.log('No accounts found for this user.');
        optionsDiv.innerHTML += '<p>No accounts found for this user.</p>';
      }
    } else {
      generalAlert({error: 'There was an error querying accounts: ' + results.message});
    }
  }
  function handleWebproperties(results) {
    if (!results.code) {
      if (results && results.items && results.items.length) {
        var appendingList = ['<h2 class="upper prompt-header">Choose a web property</h2><ul class="appending-list">'];
        for(i=0;i<results.items.length;i++){
          appendingList.push('<li><a class="link-button" data-account-id="'+results.items[i].accountId+'" data-item-id="'+results.items[i].id+'">'+results.items[i].name+'</a></li>');
        }
        appendingList.push(dndCtaTemplate());
        optionsDiv.innerHTML = appendingList.join('');
        readyChoiceLinks(queryProfiles);
        // document.getElementById('reload-button').className = '';
      } else {
        console.log('No webproperties found for this account.');
        optionsDiv.innerHTML += '<p>No webproperties found for this account.</p>';
      }
    } else {
      console.log(results);
      generalAlert({error: 'There was an error querying webproperties: ' + results.message});
    }
  }
  function handleProfiles(results) {
    if (!results.code) {
      if (results && results.items && results.items.length) {
        var appendingList = ['<h2 class="upper prompt-header">Finally, choose a profile</h2><ul class="appending-list">'];
        for(i=0;i<results.items.length;i++){
          appendingList.push('<li><a class="link-button" data-item-id="'+results.items[i].id+'" data-profile-name="'+results.items[i].name+'">'+results.items[i].name+'</a></li>');
        }
        appendingList.push(dndCtaTemplate());
        optionsDiv.innerHTML = appendingList.join('');
        readyChoiceLinks(addProfile);
      } else {
        console.log('No views (profiles) found for this account.');
        optionsDiv.innerHTML += '<p>No views (profiles) found for this account.</p>';
      }
    } else {
      console.log(results);
      generalAlert({error: 'There was an error querying views (profiles): ' + results.message});
    }
  }
  function handleLiveReportingResults(results){
    if (results.error) {
      console.log(results);
      generalAlert({error: 'There was an error querying Google Analytics: ' + results.message});
      clearInterval(starkLines.runningInterval);
    } else {
      pushResults(results);
    }
  }
  function handleDownloadCreation() {
    window.URL = window.URL || window.webkitURL;
    var content = JSON.stringify(window.starkLines.profileList),
        blob = new Blob([content], {type: 'application/json'}),
        link = document.getElementById('download-button'),
        d = new Date();
    link.style.visibility = 'visible';
    link.href = window.URL.createObjectURL(blob);
    link.download = ['stark_lines_config_',
                     d.getFullYear().toString(), '_',
                     (d.getMonth() + 1).toString(), '_',
                     d.getDate().toString(),
                     '.json'].join('');
  }
  function addProfile (profile, profileName) {
    progress(100);
    document.getElementById('social-links').style.display = 'inherit';
    var rb = document.getElementById('reload-button'),
        counters = document.getElementById('counters'),
        oldIndex = counters.children.length;
    rb.innerHTML = 'Add Profile';
    rb.className = '';
    rb.addEventListener('click', function() { makeApiCall(); }, false);
    optionsDiv.innerHTML = null;
    counters.innerHTML += profileTemplate({
      profile: profile.toString(),
      profileName: profileName,
      color: color(starkLines.profileList.length)
    });
    counters.children[oldIndex].onmouseover = function() {
      this.children[0].style.display = 'inline';
    };
    counters.children[oldIndex].onmouseout = function() {
      this.children[0].style.display = 'none';
    };
    counters.children[oldIndex].children[0].onclick = function(ev) {
      var resp = confirm('Remove this profile?');
      if (resp === true) {
        var pos = [].indexOf.call(this.parentNode.parentNode.children, this.parentNode);
        starkLines.profileList.splice(pos, 1);
        starkLines.data[pos] = window.d3.range(60).map(window.initial);
        starkLines.allData[pos] = window.d3.range(60).map(window.initial);
        this.parentNode.parentNode.removeChild(this.parentNode);
      }
    };
    if (starkLines.profileList.indexOf) {
      if (starkLines.profileList.indexOf(profile) == -1) {
        starkLines.profileList.push({id: profile, name: profileName});
      }
    } else {
      starkLines.profileList.push({id: profile, name: profileName});
    }
    if (starkLines.running === false) {
      document.getElementById('graph1').style.display = 'block';
      runnable();
    }
    if (starkLines.profileList.length == starkLines.data.length) {
      rb.style.display = 'none';
    }
    setTimeout(handleDownloadCreation, 1);
  }
  function pushResults (results) {
    var position = 0;
    for (i = 0; i < starkLines.data.length; i++) {
      if (starkLines.data[i][59].profileId == results.profileInfo.profileId) {
        position = i;
        pusher(position, results);
        return;
      } else if (starkLines.data[i][59].profileId === '') {
        position = i;
        pusher(position, results);
        return;
      }
    }
  }
  function pusher (position, results) {
    if (results.rows) {
      results.rows.sort(function(a,b) {
        return parseInt(b[1], 10) - parseInt(a[1], 10);
      });
    }
    var count = (results.rows ? window.d3.sum(results.rows, function(d) { return parseInt(d[1], 10); }) : 0),
      el = document.getElementById(results.profileInfo.profileId.toString()+'-counter'),
      dataObj = {
        time: (new Date()).getTime(),
        value: count,
        profileName: results.profileInfo.profileName,
        profileId: results.profileInfo.profileId
      };
    el.innerHTML = count;
    el = document.getElementById(results.profileInfo.profileId.toString()+'-top');
    if (results.rows) {
      el.innerHTML = results.rows[0][0].substring(0,40) + '... ' + results.rows[0][1];
    } else {
      el.innerHTML = '';
    }
    el = document.getElementById(results.profileInfo.profileId.toString()+'-link');
    if (!el.href) {
      el.href = 'https://www.google.com/analytics/web/?hl=en#realtime/rt-overview/a'+results.profileInfo.accountId.toString()+'w'+results.profileInfo.internalWebPropertyId.toString()+'p'+results.profileInfo.profileId.toString();
    }
    starkLines.data[position].shift();
    starkLines.data[position].push(dataObj);
    starkLines.allData[position].push(dataObj);
  }
  function initial() {
    return {
      time: (new Date()).getTime(),
      value: 0,
      profileName: '',
      profileId: ''
    };
  }

  var color = window.d3.scale.linear()
      .domain([0, starkLines.data.length - 1])
      .range(["#24B1E0", "#F80F40"]);

  function drawMe() {
    document.getElementById('graph1').innerHTML = null;
    var divvy = window.d3.select("#divvy"),
    n = starkLines.data.length, // number of layers
    m = starkLines.data[0].length, // number of samples per layer
    stack = window.d3.layout.stack(),
    layers = stack(
      starkLines.data.map(
        function(dd) {
          return dd.map(
            function(d, i) {
              return {
                time: d.time, 
                profileName: d.profileName,
                profileId: d.profileId, 
                x: i, 
                y: Math.max(0, d.value)
              };
            }); 
        })
    ),
    yGroupMax = window.d3.max(layers, function(layer) { return window.d3.max(layer, function(d) { return d.y; }); }),
    yStackMax = function() {
      return window.d3.max(layers, function(layer) { return window.d3.max(layer, function(d) { return d.y0 + d.y; }); });
    },
    margin = {top: 10, right: 0, bottom: 0, left: 0},
    width = document.getElementById("graph1").offsetWidth - margin.left - margin.right,
    height = document.getElementById("graph1").offsetHeight - margin.top - margin.bottom,
    x = window.d3.scale.ordinal()
      .domain(window.d3.range(m))
      .rangeRoundBands([0, width], 0.05),
    y = window.d3.scale.linear()
      .domain([0, yStackMax()])
      .range([height, 0]),
    color = window.d3.scale.linear()
      .domain([0, n - 1])
      .range(["#24B1E0", "#F80F40"]),
    xAxis = window.d3.svg.axis()
      .scale(x)
      .tickSize(0)
      .tickPadding(6)
      .orient("bottom"),
    svg = window.d3.select("#graph1").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
    layer = svg.selectAll(".layer")
      .data(layers)
      .enter().append("g")
      .attr("class", "layer")
      .style("fill", function(d, i) { return color(i); }),
    rect = layer.selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
      .attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return y(d.y0 + d.y); })
      .attr("width", x.rangeBand())
      .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
      .attr("transform", "translate(" + x(1) + ")")
      .transition()
      .duration(starkLines.delay - 50)
      .attr("transform", "translate(" + x(0) + ")");
    layer.selectAll("rect").on('mouseover', function(d,i) {
        d3.select(this).style('stroke', color).style("opacity", 0.75);
        divvy.transition().duration(200).style("opacity", 0.8);
        divvy.html(d.y.toString()+' visitors<br>'+d.profileName)
        .style("left", (d3.event.pageX) + "px")     
        .style("top", (d3.event.pageY - 28) + "px");
      }).on('mouseout', function() {
        divvy.transition().duration(200).style("opacity", 0);
        divvy.html('');
        d3.select(this).style("opacity", 1);
      });
    // starkLines.svg = svg;
    console.log(layer);
  }

  function runnable () {
    starkLines.running = true;
    var i;
    for (i = 0; i < starkLines.profileList.length; i++) {
      setTimeout(queryLiveReportingApi, 110, starkLines.profileList[i].id);
    }
    setTimeout(drawMe, 2000);
    starkLines.runningInterval = setInterval(function() {
      for (i = 0; i < starkLines.profileList.length; i++) {
        setTimeout(queryLiveReportingApi, 110, starkLines.profileList[i].id);
      }
      drawMe();
      window.d3.timer.flush(); // avoid memory leak when in background tab
    }, starkLines.delay);
  }
  function redraw () {
    var y = window.d3.scale.linear()
        .domain([0, yStackMax()])
        .rangeRound([0, height]),
      layers = stack(
        starkLines.data.map(
          function(dd) {
            return dd.map(
              function(d, i) {
                return {
                  time: d.time, 
                  profileName: d.profileName,
                  profileId: d.profileId, 
                  x: i, 
                  y: Math.max(0, d.value)
                };
              }); 
          })
      ),
      layer = svg.selectAll(".layer"),
      rect = layer.selectAll("rect")
        .data(function(d) { return d; })
        .attr("x", function(d) { return x(d.x); })
        .attr("y", function(d) { return y(d.y0 + d.y); })
        .attr("width", x.rangeBand())
        .attr("height", function(d) { return y(d.y0) - y(d.y0 - d.y); })
        .attr("transform", "translate(" + x(1) + ")")
        .transition()
        .ease('linear')
        .duration(starkLines.delay - 50)
        .attr("transform", "translate(" + x(0) + ")");
    // console.log(starkLines.data[0][59]);
    window.layerSet = layers;
    window.layerOne = layer;
    window.rectOne = rect;
  }
  // dnd interface and loading
  (function initializeDnd() {
    function handleDragOver(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }
    function loadFileProfiles(profileArray) {
      var i = 0,
          length = profileArray.length;
      window.starkLines.profileList = [];
      window.starkLines.data = window.d3.range(30).map(function(){return window.d3.range(60).map(window.initial);});
      window.starkLines.allData = window.d3.range(30).map(function(){return [];});
      document.getElementById('counters').innerHTML = null;
      for (; i < length; i++){
        addProfile(profileArray[i].id, profileArray[i].name);
      }
    }
    function handleJSONDrop(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      function makeReaderLoadFxn() {
        return (function(theFile) {
          return function(e) {
            var result = JSON.parse(e.target.result);
            loadFileProfiles(result);
          };
        })(f);
      }
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        var files = evt.dataTransfer.files,
            i = 0,
            f;
        for (; i < files.length; i++) {
          f = files[i];
          if (!(f.type.match('application/json') || f.type.match(''))) {
            generalAlert({error: 'You\'re gonna need to upload a valid JSON file to configure this baby!\nCurrently, you are uploading a file of type "'+f.type.toString()+'."'});
            continue;
          }

          var reader = new FileReader();

          reader.onload = makeReaderLoadFxn();

          reader.readAsText(f);
        }
      } else {
        generalAlert({error: 'Javascript File APIs are not fully supported in this here browser.\n Ya\'ll have to manually add profiles!'});
      }
    }
    var dropZone = document.getElementsByTagName('body')[0];
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleJSONDrop, false);
  })();

  function generalAlert (data) {
    var messageElem = document.getElementById('messages'),
      wrapper = messageElem.children[0];
    if (data.error) {
      wrapper.innerHTML = errorTemplate({error: data.error});
    } else if (data.message) {
      wrapper.innerHTML = messageTemplate({message: data.message});
    }
    messageElem.style.display = 'block';
  }

  function progress (val) {
    document.getElementById('color-bar').style.width = val.toString() + '%';
  }

  // document.getElementById('reload-button').addEventListener('click', function(evt){
  //   window.location.reload();
  // }, false);
})(this, this.document);