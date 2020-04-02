const request = require('supertest');
const test = require('tape');
const app = require('../app');

test('First tests!', function (t) {
    t.end();
});

test.onFinish(() => process.exit(0));
