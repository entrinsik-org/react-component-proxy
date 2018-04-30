import React from 'react';
import ComponentProvider, { component, bind, proxy } from './';
import { shallow, mount } from 'enzyme';

describe('ComponentProvider', () => {
  it('is truthy', () => {
    expect(ComponentProvider).toBeTruthy();
  });

  describe('bind()', () => {
    it('should exist', () => {
      expect(bind).toBeInstanceOf(Function);
    });

    it('should bind a functional component viewer', function() {
      const Hello = ({ greeting, first, last }) => (
        <span>
          {greeting}, {first} {last}
        </span>
      );

      bind('hello', Hello);

      const DynHello = component('hello');
      const hello = shallow(
        <DynHello greeting="Hi" first="Brad" last="Leupen" />
      );
      expect(hello.html()).toEqual('<span>Hi, Brad Leupen</span>');
    });
  });

  describe('component()', () => {
    beforeEach(() => {
      const Hello = ({ className, greeting, first, last }) => (
        <span className={className}>
          {greeting}, {first} {last}
        </span>
      );

      bind('hello', Hello);
    });

    it('should curie props', function() {
      const H = component('hello', {
        greeting: 'Hi',
        first: 'Brad',
        last: 'Leupen'
      });
      const hello = shallow(<H />);
      expect(hello.html()).toEqual('<span>Hi, Brad Leupen</span>');
    });

    it('should forward props', function() {
      const H = component('hello', {
        greeting: 'Hi',
        first: 'Brad',
        last: 'Leupen'
      });
      const hello = shallow(<H className="my-class" />);
      expect(hello.html()).toEqual(
        '<span class="my-class">Hi, Brad Leupen</span>'
      );
    });

    it('should support object syntax', function() {
      const H = component({
        hello: {
          greeting: 'Hi',
          first: 'Brad',
          last: 'Leupen'
        }
      });
      const hello = shallow(<H className="my-class" />);
      expect(hello.html()).toEqual(
        '<span class="my-class">Hi, Brad Leupen</span>'
      );
    });
  });

  describe('proxy()', () => {
    let RemoteHello;

    beforeEach(() => fetch.resetMocks());
    beforeEach(() => {
      const Hello = ({ className, greeting, first, last }) => (
        <span className={className}>
          {greeting}, {first} {last}
        </span>
      );

      bind('hello', Hello);
      RemoteHello = proxy('/api/hello.json{?greeting,first,last}');
    });

    it('should render an empty block before it has fetched', () => {
      const empty = shallow(
        <RemoteHello greeting="Hi" first="Brad" last="Leupen" />
      );
      expect(empty.html()).toEqual('');
    });
  });
});
