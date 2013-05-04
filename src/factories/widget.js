angular.module('kendo.directives').factory('widgetFactory', ['utils', '$parse', function(utils, $parse) {

  // Gather the options from defaults and from attributes
  var gatherOptions = function(scope, element, attrs, kendoWidget) {
    // TODO: add kendoDefaults value service and use it to get a base options object?
    // var options = kendoDefaults[kendoWidget];

    var dataSource;
    // make a deep clone of the options object passed to the directive, if any.
    var options = angular.copy(scope.$eval(attrs[kendoWidget])) || {};

    // Mixin the data that's set on the element in the options
    angular.forEach( element.data(), function(value, key) {
      // Only add data items that were put as attributes since some items put by angular and kendo
      // may have circular references and Kendo's deepCopyOne doesn't like that.
      // Also make sure not to add the widget object kendo puts in the data.
      if( !!attrs[key] && key !== kendoWidget ) {
        if( angular.isObject(value) ) {
          // Because this may be invoked on refresh (kendo-refresh) and that kendo may 
          // have modified the object put in the element's data,
          // we are parsing the attribute value to get the inital value of the object
          // and not the potentially modified one. 
          options[key] = JSON.parse(attrs[key]);
        } else {
          // Natives are immutable so we can just put them in.
          options[key] = value;
        }
      }
    });

    // If no dataSource was provided, 
    if( !options.dataSource ) {
      // Check if one was set in the element's data or in its ancestors.
      dataSource = element.inheritedData('$kendoDataSource');
      if( dataSource ) {
        options.dataSource = dataSource;
      }
    }

    // Add on-* event handlers to options.
    addEventHandlers(options, scope, attrs);

    // TODO: invoke controller.decorateOptions to allow other directives (or directive extensions)
    //       to modify the options before they get bound. This would provide an extention point for directives
    //       that require special processing like compiling nodes generated by kendo so that angular data binding
    //       can happen in kendo widget templates for example.
    //controller.decorateOptions(options);

    return options;

  };

  // Create an event handler function for each on-* attribute on the element and add to dest.
  var addEventHandlers = function(dest, scope, attrs) {
    var memo,
        eventHandlers = utils.reduce(attrs, function(memo, attValue, att) {
      var match = att.match(/^on(.+)/), eventName, fn;
      if( match ) {
        // Lowercase the first letter to match the event name kendo expects.
        eventName = match[1].charAt(0).toLowerCase() + match[1].slice(1);
        // Parse the expression.
        fn = $parse(attValue);
        // Add a kendo event listener to the memo.
        memo[eventName] = function(e) {
          // Make sure this gets invoked in the angularjs lifecycle.
          scope.$apply(function() {
            // Invoke the parsed expression with a kendoEvent local that the expression can use.
            fn(scope, {kendoEvent: e});
          });
        };
      }
      return memo;
    }, {});

    // mix the eventHandlers in the options object
    angular.extend(dest, eventHandlers);
  };

  // Create the kendo widget with gathered options
  var create = function(scope, element, attrs, kendoWidget) {

    // Create the options object
    var options = gatherOptions(scope, element, attrs, kendoWidget);

    // Bind the kendo widget to the element and return a reference to the widget.
    return element[kendoWidget](options).data(kendoWidget);
  };

  return {
    create: create
  };

}]);
