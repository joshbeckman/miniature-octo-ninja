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

  window.onload = function() {
    handleClientLoad();
  };

  window.handleClientLoad = function () {
    window.gapi.client.setApiKey(apiKey);
    window.setTimeout(checkAuth,1);
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
        document.getElementById('reload-button').className = '';
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
    rb.onclick = function() { queryAccounts(); };
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
    var count = (results.rows ? window.d3.sum(results.rows, function(d) { return parseInt(d[1], 10); }) : 0);
    var el = document.getElementById(results.profileInfo.profileId.toString()+'-counter');
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
    starkLines.data[position].push({
      time: (new Date()).getTime(),
      value: count,
      profileName: results.profileInfo.profileName,
      profileId: results.profileInfo.profileId
    });
    starkLines.allData[position].push({
      time: (new Date()).getTime(),
      value: count,
      profileName: results.profileInfo.profileName,
      profileId: results.profileInfo.profileName
    });
  }
  var initial = function () {
      return {
        time: (new Date()).getTime(),
        value: 0,
        profileName: '',
        profileId: ''
      };
    };
  window.starkLines = {
    data: window.d3.range(30).map(function(){return window.d3.range(60).map(initial);}),
    allData: window.d3.range(30).map(function(){return [];}),
    profileList: [],
    running: false,
    delay: 10000,
    counterList: [],
    runningInterval: null
  };
  var x = window.d3.scale.linear()
      .domain([1, starkLines.data[0].length - 2])
      .range([0, window.innerWidth]),
    y = window.d3.scale.linear()
      .domain([0, window.d3.max(starkLines.data, function(d){ return d.value;})])
      .rangeRound([0, h]),
    line = window.d3.svg.line()
      .x(function(d,i) {
        return x(i);
      })
      .y(function(d) {
        return h - y(d.value) - 0.5;
      }).interpolate("basis"),
    w = window.innerWidth/starkLines.data[0].length,
    h = window.innerHeight/2,
    color = function (int) {
      return ['#00A0B0','#6A4A3C','#CC333F','#EB6841','#EDC951','#3B2D38','#F02475','#F27435','#CFBE27','#BCBDAC', '#413E4A', '#73626E', '#B38184', '#F0B49E', '#F7E4BE', '#8C2318', '#5E8C6A', '#88A65E', '#BFB35A', '#F2C45A'][int];
    },
    illus = window.d3.select("#hero-img").append("svg")
      .attr("class", "hero-chart")
      .attr("width", window.innerWidth)
      .attr("height", 350),
    chart = window.d3.select("#graph1").append("svg")
      .attr("class", "chart")
      .attr("width", w * starkLines.data[0].length - 1)
      .attr("height", h),
    divvy = window.d3.select("#divvy"),
    runnable = function () {
      starkLines.running = true;

      for (i = 0; i < starkLines.data.length; i++) {
        chart.append("path")
          .attr("id", "myPath"+i.toString())
          .attr("stroke", color(i))
          .attr("stroke-width", 3)
          .attr("fill", "none")
          .attr("d", line(starkLines.data[i]));
      }
      for (i = 0; i < starkLines.profileList.length; i++) {
        setTimeout(queryLiveReportingApi, 110, starkLines.profileList[i].id);
      }
      redraw();
      starkLines.runningInterval = setInterval(function() {
        for (i = 0; i < starkLines.profileList.length; i++) {
          setTimeout(queryLiveReportingApi, 110, starkLines.profileList[i].id);
        }
        redraw();
        window.d3.timer.flush(); // avoid memory leak when in background tab
      }, starkLines.delay);
    },
    redraw = function () {
      y = window.d3.scale.linear()
        .domain([0, 1 + parseInt(window.d3.max(starkLines.data, function(dat){ return window.d3.max(dat, function(d) {return parseInt(d.value, 10);}); }), 10)])
        .rangeRound([0, h]);
      for (i = 0; i < starkLines.data.length; i++) {
        chart.selectAll("#myPath"+i.toString())
          .attr("d", line(starkLines.data[i]))
          .attr("transform", "translate(" + x(1) + ")")
          .transition()
          .ease('linear')
          .duration(starkLines.delay - 50)
          .attr("transform", "translate(" + x(0) + ")");
      }
    };
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

  document.getElementById('reload-button').addEventListener('click', function(evt){
    window.location.reload();
  }, false);
})(this, this.document);