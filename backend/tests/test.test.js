// require('leaked-handles').set({
//     fullStack: true, // use full stack traces
//     timeout: 30000, // run every 30 seconds instead of 5.
//     debugSockets: true // pretty print tcp thrown exceptions.
// });

const { closeCardConnection } = require("../newModels/cardDatabase");
const { closeFileConnection } = require("../newModels/fileDatabase");
const { closeSetConnection } = require("../newModels/setDatabase");
const { closeUserConnection } = require("../newModels/userDatabase");
const { closeMongoose } = require('../utils/mongoose');



// Close the database connection after running all the code
afterAll(async () => {
    // await closeUserConnection();
    // await closeCardConnection();
    // await closeFileConnection();
    // await closeSetConnection();
    await closeMongoose();
});

describe("Run one test to test running tests", () => {
    test("This test should not fail", () => {
        expect(2*2).toBe(4);
    });
});