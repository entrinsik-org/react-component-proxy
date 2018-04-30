import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import mockedFetch from 'jest-fetch-mock';
configure({ adapter: new Adapter() });

//setupJest.js or similar file
global.fetch = mockedFetch;
