gandalf.createActions = function(m, pubsub) {
  'use strict';
  var searchValue = m.prop(''),
    selectedIndex = m.prop(0),
    show = m.prop(false),
    emit = function (eventName) {
    	return function () {
    		pubsub.emit(eventName);
    	};
    },
    toggleShow = function() {
      m.startComputation();
      show(!show());
      searchValue('');
      selectedIndex(0);
      m.endComputation();
      if (show() && searchElement) {
        searchElement.focus();
      }
    },
    config = function(el) {
      searchElement = el;
    },
    keyDown = function(e) {
      var l = list.length,
        i = selectedIndex();
      if (e.keyCode === 40) {
        selectedIndex((i + 1) % l);
      } else if (e.keyCode === 38) {
        selectedIndex((i - 1 + l) % l);
      } else if (e.keyCode === 27) {
        toggleShow();
        pubsub.emit('editor-focus', {});
      }
    },
    keyUp = function(e) {
      var list = getList();
      if (e.keyCode === 13 && list.length) {
        list[selectedIndex()].run();
        toggleShow();
      }
    },
    getList = function() {
      return list.filter(function(item) {
        return item.name.toLowerCase().indexOf(searchValue().toLowerCase()) !== -1;
      });
    },
    list = [{
      name: 'Run query (ctrl + Enter)',
      run: emit('run-query')
    }, {
      name: 'Content assist (ctrl + Space)',
      run: emit('content-assist')
    }, {
      name: 'Bookmark',
      run: emit('bookmark-add')
    }, {
      name: 'Export schema',
      run: emit('schema-export')
    }], searchElement;

  pubsub.on('actions-toggle-show', toggleShow);

  return {
    view: function() {
      return m('div', {
        'class': 'p-menu popup' + (show() ? '' : ' hidden')
      }, [
        m('input', {
          'class': 'p-menu-search',
          config: config,
          value: searchValue(),
          oninput: m.withAttr('value', searchValue),
          onkeydown: keyDown,
          onkeyup: keyUp
        }),
        m('ul', {
          'class': 'p-menu-list'
        }, getList().map(function(item, index) {
          return m('li', {
            'class': 'p-menu-item' + (index === selectedIndex() ? ' p-menu-item-selected' : '')
          }, item.name);
        }))
      ]);
    }
  };
};
