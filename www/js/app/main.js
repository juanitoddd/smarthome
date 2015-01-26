/*
var oldBackboneSync = Backbone.sync;
Backbone.sync = function(method, model, options) {
    options || (options = {});
    if (!options.crossDomain) {
        options.crossDomain = true;
    }

    if (!options.xhrFields) {
        options.xhrFields = {withCredentials:true};
    }
    return oldBackboneSync.apply(this, [method, model, options]);
};
*/
_.extend(Backbone.Validation.callbacks, {
    valid: function (view, attr, selector) {
        var $el = view.$('[name=' + attr + ']'),
            $group = $el.closest('.form-group');

        $group.removeClass('has-error');
        $group.find('.help-block').html('').addClass('hidden');
    },
    invalid: function (view, attr, error, selector) {
        var $el = view.$('[name=' + attr + ']'),
            $group = $el.closest('.form-group');

        $group.addClass('has-error');
        $group.find('.help-block').html(error).removeClass('hidden');
    }
});

var T = window.T || {};
_.extend(T, {
    // Top level view that is currently initialized and displayed.
    activeMainView: null,
    config: {},

    API: 'http://84.113.5.65:60',
    //API: 'http://api.fussball',

    auth : false,
    // Initialize collections and main classes
    initialize: function() {

        this.container = $('#container');


        this.dashboard_tpl = _.template(
            $( "script#dashboard-tpl" ).html()
        );

        // Create main collections, bootstrapped in the html view
        this.matches = new T.Collections.Matches();

        //this.tasksRouter = new T.Routers.Tasks();

        //T.WindowResizeManager.initialize();
        //T.ListSelectionManager.initialize();
        //T.ScrollableManager.initialize();

        //T.Collections.Tasks.LazyLoading.loadTasks('active');

        T.debug = T.parseURL('debug') == 'true';
        T.trace = T.parseURL('trace') == 'true';

        T.lastUpdated = new Date();
        //T.Preferences.initialize();

        this.dashboard();

        /*
        if(this.User.logged){
            this.teams_view();
        }else
            this.login();
        */
    },

    login: function(){

        this.container.html(this.login_tpl());

        this.view = Backbone.View.extend({
            events: {
                'click #RegisterSubmit': function (e) {
                    e.preventDefault();
                    this.signUp();
                }
            },
            initialize: function () {
                // This hooks up the validation
                // See: http://thedersen.com/projects/backbone-validation/#using-form-model-validation/validation-binding
                Backbone.Validation.bind(this);
            },
            signUp: function () {
                var data = this.$el.serializeObject();
                this.model.set(data);
                // Check if the model is valid before saving
                // See: http://thedersen.com/projects/backbone-validation/#methods/isvalid
                if(this.model.isValid(true)){
                    this.model.save(null, function(data){
                        if(data){ //  Saved
                            T.auth = new T.Models.User(data.User);
                            T.dashboard();
                        }
                    });
                }//else
                    //console.log('Not Valid');
            },

            remove: function() {
                // Remove the validation binding
                // See: http://thedersen.com/projects/backbone-validation/#using-form-model-validation/unbinding
                Backbone.Validation.unbind(this);
                return Backbone.View.prototype.remove.apply(this, arguments);
            }
        });

        var view = new this.view({
            el: '#FormRegister',
            model: new T.Models.User()
        });
    },

    dashboard: function(){
        T.container.html(T.dashboard_tpl());

        $.ajax({
            url: T.API + '/arduino/digital/13?callback=?',
            data: {},
            success: function(data){
                console.log(data);
            },
            crossDomain: true,
            dataType: 'jsonp',
            jsonpCallback:'myCB'
        }).done(function(data) {
            console.log(data);
        });

        $('#pin13').live('click',function(){
            if($(this).attr('data-state') == 1){
                $.ajax({
                    url: T.API + '/arduino/digital/13/0?callback=?',
                    data: {},
                    success: function(json){
                        //console.log(json);
                        $(this).html('Turn Off');
                        $(this).attr('data-state',1);
                    },
                    crossDomain: true,
                    dataType: 'jsonp',
                    jsonpCallback:'myCB'
                }).done(function(data) {
                    console.log(data);
                    $(this).html('Turn Off');
                    $(this).attr('data-state',1);
                });
                $(this).attr('data-state',0);
            } else {
                $.ajax({
                    url: T.API + '/arduino/digital/13/1',
                    data: {},
                    success: function(json){
                        //console.log(json);
                        $(this).html('Turn On');
                        $(this).attr('data-state',0);
                    },
                    crossDomain: true,
                    dataType: 'jsonp',
                    jsonpCallback:'myCB'
                }).done(function(data) {
                    console.log(data);
                    $(this).html('Turn On');
                    $(this).attr('data-state',0);
                });
                $(this).attr('data-state',1);
            };
        });
    },

    // Start backbone router and history
    start: function() {
        Backbone.history.start();
    },

    alert: function(message) {
        $('#debug').html(message);
    },

    // Replaces console.log
    log: function(message, values, important, trace) {
        // Message (string) Values (array) Important (boolean) Trace (boolean)
        // Important & Trace make sure stuff is logged & traced even if T.debug is off
        if (T.debug || important) console.log('T.log| ', message, values);
        if (T.trace || trace) console.log(Error().stack);
    },

    // Parses specific URL params and returns their value
    parseURL: function(parameter) {
        var query = window.location.search.substring(1),
            vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (!pair[0] || !pair[1]) return;
            // Cut off trailing slash from value of last parameter
            if (i == (vars.length-1)) pair[1] = pair[1].substr(0, pair[1].length-1);
            if (decodeURIComponent(pair[0]) == parameter) {
                return decodeURIComponent(pair[1]);
            }
        }
    },
});

// Namespacing
_.extend(T, {
    User : {
        logged : false //Temp
    },
    Options: {},
    Routers: {},
    Views: {},
    Models: {},
    Collections: {}
});

$.fn.serializeObject = function () {
    "use strict";
    var a = {}, b = function (b, c) {
        var d = a[c.name];
        "undefined" != typeof d && d !== null ? $.isArray(d) ? d.push(c.value) : a[c.name] = [d, c.value] : a[c.name] = c.value
    };
    return $.each(this.serializeArray(), b), a
};