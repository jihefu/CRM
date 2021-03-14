import request from 'superagent';
import common from './common';

const Base = {};

Base.SetStateSession = (state) => {
    sessionStorage.setItem('state',JSON.stringify(state));
}

Base.GetStateSession = () => {
    return JSON.parse(sessionStorage.getItem('state'));
}

Base.RemoveStateSession = () => {
    sessionStorage.removeItem('state');
}

export default Base;