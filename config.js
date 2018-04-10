exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/my-library';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-my-library';
exports.PORT = process.env.PORT || 8080;