/*jshint maxparams: 10*/
exports.createBookmarkModel = function(m, fs, pubsub, editor, createPopupmenu) {
  'use strict';
  var show = false,
    description = m.prop(''),
    configName = function (el) {
      nameEl = el;
    },
    writeToFile = function () {
      fs.writeFile(fileName, JSON.stringify(bookmarks), function (err) {
        //TODO error handling
        console.log(err);
      });
    },
    save = function () {
      var bookmark = {
        name: nameEl.value.trim(),
        value: content,
        description: description()
      };
      nameEl.value = '';
      bookmarks.push(bookmark);
      writeToFile();
      show = false;
      pubsub.emit('editor-focus', {});
    },
    showAdd = function () {
      m.startComputation();
      content = editor.getSelection() || editor.getCursorStatement();
      description(content);
      show = true;
      m.endComputation();
      setTimeout(nameEl.focus.bind(nameEl), 0);
    },
    listView = createPopupmenu(pubsub, {
      getList: function () {
        return bookmarks || [];
      },
      renderItem: function (bookmark) {
        return [m('div', bookmark.name), m('div', {'class': 'hint-remarks'}, bookmark.value)];
      },
      itemSelected: function (bookmark) {
        var i = bookmarks.indexOf(bookmark);
        bookmarks.splice(i, 1);
        writeToFile();
        pubsub.emit('editor-focus', {});
      }
    }),
    fileName = process.env.HOME + '/.gandalf/bookmarks.json',
    bookmarks,
    nameEl,
    content;

  fs.readFile(fileName, function (err, data) {
    bookmarks = err ? [] : JSON.parse(data);
    pubsub.emit('bookmarks', bookmarks);
  });

  pubsub.on('bookmark-add', showAdd);
  pubsub.on('bookmark-delete', listView.toggleShow);

  document.addEventListener('keyup', function (e) {
    if(e.keyCode === 27 && show) {
      m.startComputation();
      show = false;
      pubsub.emit('bookmark-closed');
      m.endComputation();
    }
  });
  return {
    view: function() {
      return m('div', [m('div', {
        'class': 'container popup form' + (show ? '' : ' hidden')
      }, [
        m('h2', {
          'class': 'popup-title'
        }, 'Add bookmark'),
        m('div', {
          'class': 'form-element'
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
          'class': 'form-element'
        }, [
          m('label', 'Description:'),
          m('textarea', {
            'class': 'h-fill',
            'rows': '5',
            value: description(),
            onchange: m.withAttr('value', description)
          })
        ])
      ]), listView.view()]);
    }
  };
};
