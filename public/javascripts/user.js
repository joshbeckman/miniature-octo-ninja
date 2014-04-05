(function(window, document){
  var switchLogin = document.getElementById('switch-login'),
    switchPassword = document.getElementById('switch-password');
  if (switchLogin) {
    switchLogin.addEventListener('click', toggleLogin, false);
  }
  if (switchPassword) {
    switchPassword.addEventListener('click', togglePassword, false);
  }
  function togglePassword (evt) {
    evt.preventDefault();
    var type = this.dataset.toggleTo,
      fields = document.getElementById('settings-fields');
    if (type == 'change') {
      var div = document.createElement('div'),
        label = document.createElement('label'),
        input = document.createElement('input');
      input.type = 'password';
      input.name = 'password_conf';
      input.placeholder = 'New password';
      input.className = 'password-field';
      label.for = 'password';
      label.textContent = 'New password';
      div.className = 'pure-control-group';
      div.appendChild(label);
      div.appendChild(input);
      fields.insertBefore(div, fields.children[fields.children.length - 1]);
      // next
      div = document.createElement('div');
      label = document.createElement('label');
      input = document.createElement('input');
      input.type = 'password';
      input.name = 'password_conf';
      input.placeholder = 'Confirm password';
      input.className = 'password-field';
      label.for = 'password_conf';
      label.textContent = 'Confirm password';
      div.className = 'pure-control-group';
      div.appendChild(label);
      div.appendChild(input);
      fields.insertBefore(div, fields.children[fields.children.length - 1]);
      this.textContent = 'Keep password';
      this.dataset.toggleTo = 'keep';
    } else {
      fields.removeChild(fields.children[fields.children.length - 2]);
      fields.removeChild(fields.children[fields.children.length - 2]);
      this.textContent = 'Change password';
      this.dataset.toggleTo = 'change';
    }
  }
  function toggleLogin (evt) {
    evt.preventDefault();
    var type = this.dataset.toggleTo,
      fields = document.getElementById('login-fields');
    if (type == 'register') {
      var div = document.createElement('div'),
        label = document.createElement('label'),
        input = document.createElement('input');
      input.type = 'password';
      input.name = 'password_conf';
      input.placeholder = 'Confirm password';
      input.className = 'password-field';
      label.for = 'password_conf';
      label.textContent = 'Confirm password';
      div.className = 'pure-control-group';
      div.appendChild(label);
      div.appendChild(input);
      fields.insertBefore(div, fields.children[fields.children.length - 1]);      
      fields.parentNode.children[0].childNodes[0].textContent = 'Register';
      this.textContent = 'Sign In';
      this.dataset.toggleTo = 'signin';
      fields.parentNode.action = '/register';
    } else {
      fields.removeChild(fields.children[fields.children.length - 2]);
      // fields.removeChild(fields.children[0]);
      fields.parentNode.children[0].childNodes[0].textContent = 'Sign In';
      this.textContent = 'Register';
      this.dataset.toggleTo = 'register';
      fields.parentNode.action = '/sign-in';
    }
  }
})(this, this.document);