// require('leaked-handles').set({
//     fullStack: true, // use full stack traces
//     timeout: 30000, // run every 30 seconds instead of 5.
//     debugSockets: true // pretty print tcp thrown exceptions.
// });

const { closeCardConnection } = require("../newModels/cardDatabase");
const { closeFileConnection } = require("../newModels/fileDatabase");
const { deleteAllSets, createSet, getSet, getSets, deleteSet, deleteSets, updateSet, changeCreator, closeSetConnection } = require("../newModels/setDatabase");
const { closeUserConnection } = require("../newModels/userDatabase");
const { closeMongoose } = require('../utils/mongoose');

// require("leaked-handles");

// Close the database connection after running all the code
afterAll(async () => {
    // await closeUserConnection();
    // await closeCardConnection();
    // await closeFileConnection();
    // await closeSetConnection();
    await closeMongoose();
});

describe("Testing the set database model", () => {

    // Run all tests in a test database

    // Delete the content of the database after running tests
    beforeAll(async () => {
        await deleteAllSets();
    });

    // Delete the content of the database after each test
    afterEach(async () => {
        await deleteAllSets();
    });

    // Close the database connection after running all the code
    afterAll(async () => {
        // await closeSetConnection();
        // await closeCardConnection();
        // await closeFileConnection();
        // await closeUserConnection();
    });

    // Test creating sets
    describe("Testing creating a set", () => {

        // Test creating a valid set
        test("Create a valid set", async () => {
            const set = {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};

            const res = await createSet(set, "name");

            // Check the set was created successfully
            expect(res).toBeDefined();
            expect(res.title).toBe(set.title);
            expect(res.description).toBe(set.description);
            expect(res.public).toBe(set.public);
            expect(res.cards.length).toBe(set.cards.length);
        });

        // Test creating a set without a description
        test("Create a set without a description", async () => {
            const set = {title:"title", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};

            const res = await createSet(set, "name");

            // Check the set was created successfully
            expect(res).toBeDefined();
            expect(res.title).toBe(set.title);
            expect(res.description).not.toBeDefined();
            expect(res.public).toBe(set.public);
            expect(res.cards.length).toBe(set.cards.length);
        });

        // Test creating a set without a visibility setting
        test("Create a set without a visibility setting", async () => {
            const set = {title:"title", description:"desc", cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};

            const res = await createSet(set, "name");

            // Check the set was created successfully
            expect(res).toBeDefined();
            expect(res.title).toBe(set.title);
            expect(res.description).toBe(set.description);
            expect(res.public).toBe(false);
            expect(res.cards.length).toBe(set.cards.length);
        });

        // Test creating a duplicate set
        test("Create a duplicate set", async () => {
            const set = {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};
            
            // Create two of the set
            await createSet(set, "name");
            const res = await createSet(set, "name");

            // Check the second set was created successfully
            expect(res).toBeDefined();
            expect(res.title).toBe(set.title);
            expect(res.description).toBe(set.description);
            expect(res.public).toBe(set.public);
            expect(res.cards.length).toBe(set.cards.length);
        });

        // Test creating a set without a title
        test("Create a set without a title", async () => {
            const set = { description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};
            
            const res = await createSet(set, "name");

            // Check the set was not created
            expect(res).not.toBeDefined();
        });

        // Test creating a set without any cards
        test("Create a set without any cards", async () => {
            const set = {title:"title", description:"desc", public: true, cards: []};
            
            const res = await createSet(set, "name");

            // Check the set was not created
            expect(res).not.toBeDefined();
        });

        // Test creating a set with undefined cards
        test("Create a set with undefined cards", async () => {
            const set = {title:"title", description:"desc", public: true};
            
            const res = await createSet(set, "name");

            // Check the set was not created
            expect(res).not.toBeDefined();
        });

        // Test creating an undefined set
        test("Create an undefined set", async () => {
            const res = await createSet(undefined, "name");

            // Check the set was not created
            expect(res).not.toBeDefined();
        });

        // Test creating a set with an undefined user
        test("Create a set with an undefined user", async () => {
            const set = {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};
            
            const res = await createSet(set, undefined);

            // Check the set was not created
            expect(res).not.toBeDefined();
        });
    });

    // Test getting a set by id
    describe("Testing getting a set by id", () => {

        // Test getting a set that exists
        test("Get a set that exists", async () => {
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            const res = await getSet(set.id);

            expect(res).toEqual(set);
        });

        // Test getting a set that does not exist
        test("Get a set that does not exist", async () => {
            const res = await getSet("fakeID");
            expect(res).not.toBeDefined();
        });

        // Test getting a set with an id that does not exist but has length 24
        test("Get set with fake id with length 24", async () => {
            const res = await getSet("66b491a970c9eac4c3a1c17b");
            expect(res).not.toBeDefined();
        });

        // Test getting a set with an undefined id
        test("Get a set with an undefined id", async () => {
            const res = await getSet(undefined);
            expect(res).not.toBeDefined();
        });

    });



    // Test getting all the sets
    describe("Testing getting all sets", () => {

        // Combinations of arguments for getSets that will return all public sets
        const PUBLIC_CONFIG = [
            {username: undefined, all: undefined, visible: undefined},
            {username: undefined, all: true, visible: undefined},
            {username: undefined, all: false, visible: undefined},
            {username: undefined, all: true, visible: false},
            {username: undefined, all: true, visible: true},
            {username: undefined, all: undefined, visible: false},
            {username: undefined, all: undefined, visible: true}
        ];

        // Populate the database before each query
        beforeEach(async () => {
            const sets = [
                {set: {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name"}, // Public set by 'name'
                {set: {title:"title", description:"desc", public: false, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name"}, // Private set by 'name'
                {set: {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name2"}, // Public set by 'name2'
                {set: {title:"title", description:"desc", public: false, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name2"} // Private set by 'name2'
            ];

            // Create the sets
            for(let i in sets) await createSet(sets[i].set, sets[i].user);
        });

        // Get all the public sets
        test.each(PUBLIC_CONFIG)("Get all the public sets", async (args) => {
            const res = await getSets(args.username, args.all, args.visible);

            // Check the two public sets are returned
            expect(res.length).toBe(2);
            expect(res[0].public).toBe(true);
            expect(res[1].public).toBe(true);
        });

        // Get all the public sets of a specific user
        test("Get all the public sets of a specific user", async () => {
            const res = await getSets("name", false, true);

            // Check the one public set is returned
            expect(res.length).toBe(1);
            expect(res[0].user).toBe("name");
            expect(res[0].public).toBe(true);
        });

        // Get all the cards of a user (public and private)
        test("Get all the sets of a specific user", async () => {
            const res = await getSets("name");

            // Check the two sets by the user are returned
            expect(res.length).toBe(2);
            expect(res[0].user).toBe("name");
            expect(res[1].user).toBe("name");
        });

        // Get all the public sets and all the cards of a user
        test("Get all the public sets and all the sets created by a user", async () => {
            const res = await getSets("name", true);

            expect(res.length).toBe(3);
        });

    });

    // Test getting sets by their title specifically
    describe("Testing getting sets by their title specifcially", () => {
        // Combinations of arguments for getSets that will return all public sets
        const PUBLIC_CONFIG = [
            {username: undefined, all: undefined, visible: undefined},
            {username: undefined, all: true, visible: undefined},
            {username: undefined, all: false, visible: undefined},
            {username: undefined, all: true, visible: false},
            {username: undefined, all: true, visible: true},
            {username: undefined, all: undefined, visible: false},
            {username: undefined, all: undefined, visible: true}
        ];

        // Populate the database before each query
        beforeEach(async () => {
            const sets = [
                {set: {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name"}, // Public set by 'name'
                {set: {title:"title", description:"desc", public: false, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name"}, // Private set by 'name'
                {set: {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name2"}, // Public set by 'name2'
                {set: {title:"title", description:"desc", public: false, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name2"}, // Private set by 'name2'
                {set: {title:"other", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name"}, // Public set by 'name'
                {set: {title:"other", description:"desc", public: false, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name"}, // Private set by 'name'
                {set: {title:"other", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name2"}, // Public set by 'name2'
                {set: {title:"other", description:"desc", public: false, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name2"}, // Private set by 'name2'
                {set: {title:"another", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name"}, // Public set by 'name'
                {set: {title:"another", description:"desc", public: false, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name"}, // Private set by 'name'
                {set: {title:"another", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name2"}, // Public set by 'name2'
                {set: {title:"another", description:"desc", public: false, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, user: "name2"} // Private set by 'name2'
            ];

            // Create the sets
            for(let i in sets) await createSet(sets[i].set, sets[i].user);
        });



        // Get all the public sets with a specific title
        test.each(PUBLIC_CONFIG)("Get all the public sets with a specific title", async (args) => {
            const res = await getSets(args.username, args.all, args.visible, "other");

            // Check the returned sets are public
            expect(res.length).toBe(4);
            for(let i in res) expect(res[i].public).toBe(true);
        });

        // Get all the public sets of a specific user with a specific title
        test("Get all the public sets of a specific user with a specific title", async () => {
            const res = await getSets("name", false, true, "other");

            // Check the one public set is returned
            expect(res.length).toBe(2);
            for(let i in res) {
                expect(res[i].user).toBe("name");
                expect(res[i].public).toBe(true);
            }
        });

        // Get all the cards of a user (public and private) with a specific title
        test("Get all the sets of a specific user with a specific title", async () => {
            const res = await getSets("name", false, false, "other");

            // Check the two sets by the user are returned
            expect(res.length).toBe(4);
            for(let i in res) expect(res[i].user).toBe("name");
        });

        // Get all the public sets and all the cards of a user with a specific title
        test("Get all the public sets and all the sets created by a user with a specific title", async () => {
            const res = await getSets("name", true, false, "other");

            expect(res.length).toBe(6);
        });
    });

    // Test deleting sets by id
    describe("Testing deleting sets by id", () => {

        // Delete a set with a valid id
        test("Delete a set with a valid id", async () => {
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            expect(set).toBeDefined();

            await deleteSet(set.id);

            expect(await getSet(set.id)).not.toBeDefined();
        });

        // Delete a set with an invalid id
        test("Delete a set with an invalid id", async () => {
            // Assert the set does not exist
            expect(await getSet("fakeID")).not.toBeDefined();

            expect(async () => await deleteSet("fakeID")).not.toThrow();

            // Asser the set does not exist
            expect(await getSet("fakeID")).not.toBeDefined();
        });

        // Delete a set with an invalid id of length 24
        test("Delete a set with an invalid id of length 24", async () => {
            // Assert the set does not exist
            expect(await getSet("66b491a970c9eac4c3a1c17b")).not.toBeDefined();

            expect(async () => await deleteSet("66b491a970c9eac4c3a1c17b")).not.toThrow();

            // Asser the set does not exist
            expect(await getSet("66b491a970c9eac4c3a1c17b")).not.toBeDefined();
        });

        // Delete a set with an undefined id
        test("Delete a set with an undefined id", async () => {
            // Assert the delete does not cause any errors
            expect(async () => await deleteSet(undefined)).not.toThrow();
        });
    });

    // Test deleting sets by the user that created them
    describe("Testing deleting sets by the user that created them", () => {

        // Delete sets by a user that has one set
        test("Delete sets by a user that has one set", async () => {
            expect(await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name")).toBeDefined();
            expect((await getSets("name")).length).toBe(1);

            await deleteSets("name");

            const res = await getSets("name");

            expect(res).toBeDefined();
            expect(res.length).toBe(0);
        });

        // Delete sets by a user that has multiple sets
        test("Delete sets by a user that has multiple sets", async () => {
            expect(await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name")).toBeDefined();
            expect(await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name")).toBeDefined();
            expect((await getSets("name")).length).toBe(2);

            await deleteSets("name");

            const res = await getSets("name");

            expect(res).toBeDefined();
            expect(res.length).toBe(0);
        });     

        // Delete sets by a user that has no sets
        test("Delete sets by a user that has no sets", async () => {
            expect((await getSets("name")).length).toBe(0);

            await deleteSets("name");

            expect((await getSets("name")).length).toBe(0);
        });

        // Delete sets by an undefined user
        test("Delete sets by an undefined user", async () => {
            expect(async () => await deleteSets(undefined)).not.toThrow();
        });

    });

    // Test updating the details of a set
    describe("Testing updating the details of a set", () => {

        const VALID_UPDATES = [
            {title: "newTitle", description: "newDescription", public: false, cards: [
                {term: {file: false, content: "newTerm"}, 
                definition:  {file: false, content: "newDef"}}
            ]}, // All new fields
            {title: "newTitle", public: true, cards: [
                {term: {file: false, content: "newTerm"}, 
                definition:  {file: false, content: "newDef"}}
            ]}, // No description
            {title: "newTitle", description: "newDescription", cards: [
                {term: {file: false, content: "newTerm"}, 
                definition:  {file: false, content: "newDef"}}
            ]} // No public field
        ];

        const INVALID_UPDATES = [
            {description: "newDescription", public: true, cards: [{term: {file: false, content: "newTerm"}, definition:  {file: false, content: "newDef"}}]}, // No title
            {title: "newTitle", description: "newDescription", public: true, cards: []}, // Cards length 0
            {title: "newTitle", description: "newDescription", public: true }, // No cards    
            {}, // Update has not fields
            undefined // Update is not defined
        ];

        // Test valid updates to sets
        test.each(VALID_UPDATES)("Update a set with valid details", async (update) => {
            // Create a set to update
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            expect(set).toBeDefined();

            // Update the set
            const res = await updateSet(set.id, update);

            // Check that the update happened
            expect(res.title).toBe(update.title);
            expect(res.description).toBe(update.description);
            expect(res.cards.length).toBe(update.cards.length);
            if(update.public) expect(res.public).toBe(true);
            else expect(res.public).toBe(false);
        });

        // Test invalid updates to sets
        test.each(INVALID_UPDATES)("Update a set with invalid details", async (update) => {
            // Create a set to update
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            expect(set).toBeDefined();

            // Update the set
            const res = await updateSet(set.id, update);

            // Check that the update did not occur
            expect(res).not.toBeDefined();
            const res2 = await getSet(set.id);
            expect(res2).toEqual(set);
        });

        // Test updating a set that does not exist
        test("Update a set that does not exist", async () => {
            const update = {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};
            // Update the set
            const res = await updateSet("fakeID", update);

            // Check that the result is undefined
            expect(res).not.toBeDefined();
        });

        // Test updaing a set that does not exist with an id of length 24
        test("Update a set that does not exist with an id of length 24", async () => {
            const update = {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};
            // Update the set
            const res = await updateSet("66b491a970c9eac4c3a1c17b", update);

            // Check that the result is undefined
            expect(res).not.toBeDefined();
        });

        // Test updating an undefined set
        test("Update an undefined set", async () => {
            const update = {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};
            // Update the set
            const res = await updateSet(undefined, update);
            
            // Check that the result is undefined
            expect(res).not.toBeDefined();
        });

    });

    // Test changing the creator of a set
    describe("Testing changing the creator of a set", () => {


        // Test changing a user with one set
        test("Change a user with one set", async () => {
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            expect(set.user).toBe("name");
            
            expect((await getSets("newUser")).length).toBe(0);
            expect((await getSets("name")).length).toBe(1);

            // Change user
            await changeCreator("name", "newUser");

            // Check that the set swapped over
            expect((await getSets("newUser")).length).toBe(1);
            expect((await getSets("name")).length).toBe(0);
        });

        // Test changing a user with multiple sets
        test("Change a user with multiple sets", async () => {
            await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            
            expect((await getSets("newUser")).length).toBe(0);
            expect((await getSets("name")).length).toBe(2);

            // Change user
            await changeCreator("name", "newUser");

            // Check that the sets get swapped over
            expect((await getSets("newUser")).length).toBe(2);
            expect((await getSets("name")).length).toBe(0);
        });

        // Test changing a user with no sets
        test("Change a user with no sets", async () => {
            // Add a set for a different user
            await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name2");

            expect((await getSets("newUser")).length).toBe(0);
            expect((await getSets("name")).length).toBe(0);

            // Change user
            await changeCreator("name", "newUser");

            // Check that the set does not swap to either user
            expect((await getSets("newUser")).length).toBe(0);
            expect((await getSets("name")).length).toBe(0)
        });

        // Test changing a user with no old username
        test("Change a user with an undefined old username", async () => {
            await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            
            expect((await getSets("name")).length).toBe(2);
            expect((await getSets("newUser")).length).toBe(0);

            // Change user
            await changeCreator(undefined, "newUser");

            // Check that the sets do not get swapped over
            expect((await getSets("name")).length).toBe(2);
            expect((await getSets("newUser")).length).toBe(0);
        });

        // Test changing a user with no new username
        test("Change a user with an undefined new username", async () => {
            await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            
            expect((await getSets("name")).length).toBe(2);
            expect((await getSets("newUser")).length).toBe(0);

            // Change user
            await changeCreator("name", undefined);

            // Check that the sets do not get swapped over
            expect((await getSets("name")).length).toBe(2);
            expect((await getSets("newUser")).length).toBe(0);
        });

    });

});