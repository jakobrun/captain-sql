gandalf.createPopupmenu = function(pubsub, controller) {
  'use strict';
  var searchValue = m.prop(''),
    selectedIndex = m.prop(0),
    show = m.prop(false),
    toggleShow = function() {
      m.startComputation();
      show(!show());
      searchValue('');
      selectedIndex(0);
      m.endComputation();
      if (show() && searchElement) {
        setTimeout(function(){searchElement.focus();}, 1);
      }
    },
    config = function(el) {
      searchElement = el;
    },
    keyDown = function(e) {
      var l = getList().length,
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
    getList = function() {
      return controller.getList().filter(function(item) {
        return item.name.toLowerCase().indexOf(searchValue().toLowerCase()) !== -1;
      });
    },
    keyUp = function(e) {
      var list = getList();
      if (e.keyCode === 13 && list.length) {
        controller.itemSelected(list[selectedIndex()]);
        toggleShow();
      }
    },
    searchElement;
  return {
  	toggleShow: toggleShow,
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
          }, controller.renderItem ? controller.renderItem(item) : item.name);
        }))
      ]);
    }
  };
};
