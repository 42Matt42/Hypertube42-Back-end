// const request = require('supertest');
const test = require('tape');
const app = require('../app');

test('before', function (assert) {
    assert.pass(app.on("appStarted", function(){
        console.log("Ready for testing");
        assert.end();
    }));
});

test('First tests!', function (t) {
    t.end();
});

test.onFinish(() => process.exit(0));
