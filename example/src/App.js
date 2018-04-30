import React, { Component } from 'react';

import { bind, proxy } from 'react-component-proxy';

bind('highchart', props => <div>{JSON.stringify(props)}</div>);

const Trend = proxy('http://localhost:3002/v/trend.json{?dataset,chartType,interval,x}')

export default class App extends Component {
  render() {
    return (
      <Trend dataset="admin:northwind-orders" x="OrderDate" interval="month" chartType="column" />
    );
  }
}
