/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			this.todoTemplate = Handlebars.compile($('#todo-template').html());
			this.footerTemplate = Handlebars.compile($('#footer-template').html());
			this.bindEvents();

      new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');      
		},
		bindEvents: function () {
			$('#new-todo').on('keyup', create.bind(App));
			$('#toggle-all').on('change', toggleAll.bind(App));
			$('#footer').on('click', '#clear-completed', destroyCompleted.bind(App));
			$('#todo-list')
				.on('change', '.toggle', toggle.bind(App))
				.on('dblclick', 'label', edit.bind(App))
				.on('keyup', '.edit', editKeyup.bind(App))
				.on('focusout', '.edit', update.bind(App))
				.on('click', '.destroy', destroy.bind(App));
		},
		render: function () {
			var todos = getFilteredTodos();
			$('#todo-list').html(this.todoTemplate(todos));
			$('#main').toggle(todos.length > 0);
			$('#toggle-all').prop('checked', getActiveTodos().length === 0);
			this.renderFooter();
			$('#new-todo').focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			$('#footer').toggle(todoCount > 0).html(template);
		},
		// toggleAll: function (e) {
		// 	var isChecked = $(e.target).prop('checked');

		// 	this.todos.forEach(function (todo) {
		// 		todo.completed = isChecked;
		// 	});

		// 	this.render();
		// },
		// getActiveTodos: function () {
		// 	return this.todos.filter(function (todo) {
		// 		return !todo.completed;
		// 	});
		// },
		// getCompletedTodos: function () {
		// 	return this.todos.filter(function (todo) {
		// 		return todo.completed;
		// 	});
		// },
		// getFilteredTodos: function () {
		// 	if (this.filter === 'active') {
		// 		return this.getActiveTodos();
		// 	}

		// 	if (this.filter === 'completed') {
		// 		return this.getCompletedTodos();
		// 	}

		// 	return this.todos;
		// },
		// destroyCompleted: function () {
		// 	this.todos = this.getActiveTodos();
		// 	this.filter = 'all';
		// 	this.render();
		// },
		// // accepts an element from inside the `.item` div and
		// // returns the corresponding index in the `todos` array
		// indexFromEl: function (el) {
		// 	var id = $(el).closest('li').data('id');
		// 	var todos = this.todos;
		// 	var i = todos.length;

		// 	while (i--) {
		// 		if (todos[i].id === id) {
		// 			return i;
		// 		}
		// 	}
		// },
		// create: function (e) {
		// 	var $input = $(e.target);
		// 	var val = $input.val().trim();

		// 	if (e.which !== ENTER_KEY || !val) {
		// 		return;
		// 	}

		// 	this.todos.push({
		// 		id: util.uuid(),
		// 		title: val,
		// 		completed: false
		// 	});

		// 	$input.val('');

		// 	this.render();
		// },
		// toggle: function (e) {
		// 	var i = this.indexFromEl(e.target);
		// 	this.todos[i].completed = !this.todos[i].completed;
		// 	this.render();
		// },
		// edit: function (e) {
		// 	var $input = $(e.target).closest('li').addClass('editing').find('.edit');
		// 	$input.val($input.val()).focus();
		// },
		// editKeyup: function (e) {
		// 	if (e.which === ENTER_KEY) {
		// 		e.target.blur();
		// 	}

		// 	if (e.which === ESCAPE_KEY) {
		// 		$(e.target).data('abort', true).blur();
		// 	}
		// },
		// update: function (e) {
		// 	var el = e.target;
		// 	var $el = $(el);
		// 	var val = $el.val().trim();

		// 	if (!val) {
		// 		this.destroy(e);
		// 		return;
		// 	}

		// 	if ($el.data('abort')) {
		// 		$el.data('abort', false);
		// 	} else {
		// 		this.todos[this.indexFromEl(el)].title = val;
		// 	}

		// 	this.render();
		// },
		// destroy: function (e) {
		// 	this.todos.splice(this.indexFromEl(e.target), 1);
		// 	this.render();
		// }
	};

	App.init();

	// Insert functions here

	function toggleAll(e) {
		var isChecked = $(e.target).prop('checked');

		App.todos.forEach(function (todo) {
			todo.completed = isChecked;
		});

		App.render();
	}

	function getActiveTodos() {
		return App.todos.filter(function (todo) {
			return !todo.completed;
		});
	}

	function getCompletedTodos() {
		return App.todos.filter(function (todo) {
			return todo.completed;
		});
	}

	function getFilteredTodos() {
		if (App.filter === 'active') {
			return getActiveTodos();
		}

		if (App.filter === 'completed') {
			return getCompletedTodos();
		}

		return App.todos;
	}

	function destroyCompleted() {
		App.todos = getActiveTodos();
		App.filter = 'all';
		App.render();
	}

		// accepts an element from inside the `.item` div and
	// returns the corresponding index in the `todos` array
	function indexFromEl(el) {
		var id = $(el).closest('li').data('id');
		var todos = App.todos;
		var i = todos.length;

		while (i--) {
			if (todos[i].id === id) {
				return i;
			}
		}
	}

	function create(e) {
		var $input = $(e.target);
		var val = $input.val().trim();

		if (e.which !== ENTER_KEY || !val) {
			return;
		}

		App.todos.push({
			id: util.uuid(),
			title: val,
			completed: false
		});

		$input.val('');

		App.render();
	}

	function toggle(e) {
		var i = indexFromEl(e.target);
		App.todos[i].completed = !App.todos[i].completed;
		App.render();
	}

	function edit(e) {
		var $input = $(e.target).closest('li').addClass('editing').find('.edit');
		$input.val($input.val()).focus();
	}

	function editKeyup(e) {
		if (e.which === ENTER_KEY) {
			e.target.blur();
		}

		if (e.which === ESCAPE_KEY) {
			$(e.target).data('abort', true).blur();
		}
	}

	function update(e) {
		var el = e.target;
		var $el = $(el);
		var val = $el.val().trim();

		if (!val) {
			App.destroy(e);
			return;
		}

		if ($el.data('abort')) {
			$el.data('abort', false);
		} else {
			App.todos[indexFromEl(el)].title = val;
		}

		App.render();
	}

	function destroy(e) {
		App.todos.splice(indexFromEl(e.target), 1);
		App.render();
	}

});