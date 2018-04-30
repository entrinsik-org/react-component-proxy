import React, { PureComponent } from 'react';
import Fetch from 'react-fetch-component';
import URITemplate from 'urijs/src/URITemplate';
import _ from 'lodash';

/**
 * Provides support for late-bound components that may be served up from the server. Components
 * are looked up by a contextualizsed hash of the format { [name]: Component }. The context object
 * can be supplied through in one of two ways.
 * 1. by using the ComponentProvider component
 * @example
 * render() {
 *    const components = {
 *      hello: HelloComponent
 *    };
 *
 *    return (
 *    <ComponentProvider value={components}>
 *      ...
 *    </ComponentProvider>
 * }
 *
 * 2. by calling the exported bind() method
 * @example
 * bind('hello',  HelloComponent);
 */

// default components fed into the component context
const components = {};

const ComponentContext = React.createContext(components);

function forwardRef(callback) {
  return React.forwardRef(callback);
  // return props => callback(props);
}

/**
 * Converts a component id into a react component id
 * @param {string} str the informer visual id
 */
const componentId = str => {
  str = _.camelCase(str);
  return `${str[0].toUpperCase()}${str.substr(1)}`;
};

/**
 * Binds a component to a name for dynamic rendering
 * @param {string} name the component name
 * @param {function|Component} component the bound component
 */
function bind(name, component) {
  components[componentId(name)] = component;
}

/**
 * Parses a config object into [ component, props ]
 * @param {string|{}} config the component name or a config object with the format { [name]: props }
 * @param {* =} props default props
 */
function parseConfig(config, props = {}) {
  if (_.isString(config)) return [componentId(config), props];

  return _(config)
    .entries()
    .map(([component, props]) => [componentId(component), props])
    .first();
}

/**
 * A component wrapper for dynamically bound components
 */
class ComponentWrapper extends PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const { components, component, ...props } = this.props;
    const Component = components[component];
    if (!Component) throw new Error('No component bound to name: ' + component);

    return <Component {...props} />;
  }
}

/**
 * Creates a new dynamic component instance.
 * @example
 * render() {
 *    const HelloSmith = component('hello', { greeting: 'Hello', last: 'Smith' });
 *
 *    return <HelloSmith first="Jane" />
 * }
 *
 * @param {string|{}} config the component name or config
 * @param {{}=} model optional model (if component name is supplied)
 */
function component(config, model) {
  const [component, defaults] = parseConfig(config, model);

  return forwardRef((props, ref) => {
    return (
      <ComponentContext.Consumer>
        {components => (
          <ComponentWrapper
            components={components}
            component={component}
            ref={ref}
            {...defaults}
            {...props}
          />
        )}
      </ComponentContext.Consumer>
    );
  });
}

/**
 * Creates a proxied component whose props are used to expand the supplied
 * URI template, and whose result is rendered as a late bound component.
 *
 * @example
 * const Trend = proxy('/v/trend.json{?dataset,chartType,interval}');
 * return (
 *    <Trend
 *      dataset="admin:northwind-orders"
 *      chartType="column"
 *      interval="year" />
 * );
 *
 * @param {string} uri a templated uri to the remote endpoint
 * @param {{}} params params metadata
 */
function proxy(uri, params) {
  const template = new URITemplate(uri);
  const defaults = _.mapValues(params, p => p.default);

  function configureParams(params) {
    return _({})
      .assign(defaults)
      .assign(params)
      .mapValues(v => (_.isArray(v) || _.isObject(v) ? JSON.stringify(v) : v))
      .value();
  }

  const Component = forwardRef((props, ref) => {
    const { children = () => null } = props;

    const params = configureParams(props);

    const href = template.expand(params);

    // forward non-template props
    const otherProps = _.omit(props, Object.keys(params));

    const render = viewModel => {
      // strip out hal hypermedia
      const { _links, _embedded, ...config } = viewModel;
      const [component, defaults] = parseConfig(config);

      return (
        <ComponentContext.Consumer>
          {components => (
            <ComponentWrapper
              components={components}
              component={component}
              {...defaults}
              {...otherProps}
              ref={ref}
            />
          )}
        </ComponentContext.Consumer>
      );
    };

    return (
      <Fetch url={href} ref={ref} as="json">
        {({ data, ...other }) => {
          return data ? render(data) : children(other);
        }}
      </Fetch>
    );
  });

  // attaches an href function for convenience
  Component.href = params => template.expand(configureParams(params));
  return Component;
}

export default function ComponentProvider({ components, children }) {
  return (
    <ComponentContext.Provider value={components}>
      {children}
    </ComponentContext.Provider>
  );
}

function withComponents(Component) {
  return forwardRef((props, ref) => (
    <ComponentContext.Consumer>
      {components => <Component components={components} {...props} ref={ref} />}
    </ComponentContext.Consumer>
  ));
}

function ComponentConsumer({ render }) {
  return <ComponentContext.Consumer>{render}</ComponentContext.Consumer>;
}

export {
  bind,
  component,
  componentId,
  proxy,
  withComponents,
  ComponentContext,
  ComponentConsumer
};
