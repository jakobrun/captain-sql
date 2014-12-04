var createBookmarkModel = function(m, fs) {
  'use strict';
  var show = false,
    description = m.prop(''),
    configName = function (el) {
      nameEl = el;
    },
    save = function () {
      var name = nameEl.value.trim();
      var bookmark = bookmarks.filter(function (b) {
        return b.name === name;
      })[0];
      if(!bookmark) {
        bookmark = {name: name};
        bookmarks.push(bookmark);
      }
      bookmark.value = content;
      bookmark.description = description();
      fs.writeFile(fileName, JSON.stringify(bookmarks), function (err) {
        //TODO error handling
        console.log(err);
      });
      show = false;
    },
    fileName = process.env.HOME + '/.gandalf/bookmarks.json',
    bookmarks,
    nameEl,
    content;

  fs.readFile(fileName, function (err, data) {
    bookmarks = err ? [] : JSON.parse(data);
  });

  document.addEventListener('keyup', function (e) {
    if(e.keyCode === 27 && show) {
      m.startComputation();
      show = false;
      m.endComputation();
    }
  });
  return {
    show: function (contentValue) {
      m.startComputation();
      content = contentValue;
      description(contentValue);
      show = true;
      m.endComputation();
      setTimeout(nameEl.focus.bind(nameEl), 0);
    },
    view: function() {
      return m('div', {
        'class': 'container popup' + (show ? '' : ' hidden')
      }, [
        m('h2', {
          'class': 'popup-title'
        }, 'Add bookmark'),
        m('div', {
          'class': ''
        }, [
          m('label', 'Name:'),
          m('input', {
            'class': 'h-fill',
            config: configName,
            onkeyup: function (e) {
              if(e.keyCode === 13) {
                save();
              }
            }
          })
        ]),
        m('div', {
          'class': ''
        }, [
          m('label', 'Description:'),
          m('textarea', {
            'class': 'h-fill',
            'rows': '5',
            value: description(),
            onchange: m.withAttr('value', description)
          })
        ])
      ]);
    }
  };
};
