// require('leaked-handles').set({
//     fullStack: true, // use full stack traces
//     timeout: 30000, // run every 30 seconds instead of 5.
//     debugSockets: true // pretty print tcp thrown exceptions.
// });

// Set up supertest
const request = require("supertest");
const app = require("../app");
const { deleteAllUsers, closeUserConnection } = require("../newModels/userDatabase");
const { deleteAllSets, createSet, getSet, closeSetConnection } = require("../newModels/setDatabase");
const { closeCardConnection, deleteAllCards } = require("../newModels/cardDatabase");
const { closeFileConnection } = require("../newModels/fileDatabase");
const { closeMongoose } = require('../utils/mongoose');

// require("leaked-handles");
// const api = supertest(app);

// Close the database connection after running all the code
afterAll(async () => {
    // await closeUserConnection();
    // await closeCardConnection();
    // await closeFileConnection();
    // await closeSetConnection();
    await closeMongoose();
});

describe("Testing the backend sets API", () => {

    // Run all tests in a test database
    beforeAll(async () => {
        // Delete the content of the database before all the tests
        await deleteAllUsers();
        await deleteAllCards();
        await deleteAllSets();
    });

    
    afterEach(async () => {
        // Delete the content of the database after each test
        await deleteAllUsers();
        await deleteAllCards();
        await deleteAllSets();
    });

    // Close the database connection after running all the code
    afterAll(async () => {
        // await closeCardConnection();
        // await closeSetConnection();
        // await closeUserConnection();
        // await closeFileConnection();
        // await supertest.close();
        // await request(app).close();
        // await app.close();
    });


    // Test the get endpoint for getting all sets
    describe("Testing getting all sets", () => {

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

            // Create both users
            await request(app).post("/api/user/register").send({username: "name", password: "password"});
            await request(app).post("/api/user/register").send({username: "name2", password: "password"});
        });

        // Get all the public sets
        test("Get all the public sets when not logged in", async () => {
            const res = await request(app).get("/api/set").expect(200);

            // Check the two public sets are returned
            expect(res.body.length).toBe(2);
            expect(res.body[0].public).toBe(true);
            expect(res.body[1].public).toBe(true);
        });

        // Get all the public sets of a specific user
        test("Get all the sets by a specific user when not logged in", async () => {
            const res = await request(app).get("/api/set?user=name").expect(200);

            // Check the one public set is returned
            expect(res.body.length).toBe(1);
            expect(res.body[0].user).toBe("name");
            expect(res.body[0].public).toBe(true);
        });

        // Get all the cards of a user (public and private)
        test("Get all the sets of a specific user when logged in as that user", async () => {
            // Login
            const user = await request(app).post("/api/user/login").send({username: "name", password: "password"}).expect(200);

            // Get all the public sets as that user
            const res = await request(app).get("/api/set?user=name")
                .set("Authorization", "bearer " + user.body.token).expect(200);

            // Check the two sets by the user are returned
            expect(res.body.length).toBe(2);
            expect(res.body[0].user).toBe("name");
            expect(res.body[1].user).toBe("name");
        });

        // Get all the cards of a user (public and private)
        test("Get all the sets of a specific user when logged in as another user", async () => {
            // Login
            const user = await request(app).post("/api/user/login").send({username: "name2", password: "password"}).expect(200);

            // Get all the public sets as that user
            const res = await request(app).get("/api/set?user=name")
                .set("Authorization", "bearer " + user.body.token).expect(200);

            // Check the two sets by the user are returned
            expect(res.body.length).toBe(1);
            expect(res.body[0].user).toBe("name");
            expect(res.body[0].public).toBe(true);
        });

        // Get all the public sets and all the cards of a user
        test("Get all the public sets when logged in as a user", async () => {
            // Login
            const user = await request(app).post("/api/user/login").send({username: "name", password: "password"}).expect(200);

            // Get all the public sets as that user
            const res = await request(app).get("/api/set")
                .set("Authorization", "bearer " + user.body.token).expect(200);

            expect(res.body.length).toBe(3);
        });

        // Get all the public sets when logged in as an invalid user
        test("Get all the public sets when logged in as an invalid user", async () => {
            // Get all the public sets as that user
            const res = await request(app).get("/api/set")
                .set("Authorization", "bearer fakeToken").expect(200);

            expect(res.body.length).toBe(2);
            expect(res.body[0].public).toBe(true);
            expect(res.body[1].public).toBe(true);
        });

    });

    // Test the /:id endpoint for getting a specific set
    describe("Testing the /:id endpoint for getting a set by id", () => {

        // Test getting a set that exists
        test("Get a public set while not logged in", async () => {
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            
            const res = await request(app).get("/api/set/" + set.id).expect(200);

            expect(res.body).toEqual(set);
        });

        // Test getting a private set when logged in
        test("Get a private set while logged in", async () => {
            // Login and create the set
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = await createSet({title:"title", description:"desc", public: false, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            
            const res = await request(app).get("/api/set/" + set.id)
                .set("Authorization", "bearer " + user.body.token).expect(200);

            expect(res.body).toEqual(set);
        });

        // Test getting a private set when logged in as a different user
        test("Get a private set while logged in as another user", async () => {
            // Login and create the set
            const user = await request(app).post("/api/user/register").send({username: "name2", password: "password"}).expect(200);
            const set = await createSet({title:"title", description:"desc", public: false, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            
            const res = await request(app).get("/api/set/" + set.id)
                .set("Authorization", "bearer " + user.body.token).expect(403);

            expect(res.body).toEqual({});
        });

        // Test getting a private set when not logged in
        test("Get a private set while not logged in", async () => {
            const set = await createSet({title:"title", description:"desc", public: false, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            
            const res = await request(app).get("/api/set/" + set.id).expect(401);

            expect(res.body).toEqual({});
        });

        // Test getting a set that does not exist
        test("Get a set that does not exist", async () => {
            const res = await request(app).get("/api/set/fakeSet").expect(404);
            
            expect(res.body).toEqual({});
        });

        // Test getting a set with an id that does not exist but has length 24
        test("Get set with fake id with length 24", async () => {
            const res = await request(app).get("/api/set/66b491a970c9eac4c3a1c17b").expect(404);
            
            expect(res.body).toEqual({});
        });

    });

    // Test the post endpoint for creating new sets
    describe("Testing the post endpoint for creating sets", () => {

        // Test creating a valid set when logged in
        test("Create a valid set while logged in", async () => {
            // Login and declare the set
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};

            const res = await request(app).post("/api/set").send(set)
                .set("Authorization", "bearer " + user.body.token).expect(200);

            // Check the set was created successfully
            expect(res.body).toBeDefined();
            expect(res.body.title).toBe(set.title);
            expect(res.body.description).toBe(set.description);
            expect(res.body.public).toBe(set.public);
            expect(res.body.cards.length).toBe(set.cards.length);
        });

        // Test creating a valid set when not logged in
        test("Create a valid set while not logged in", async () => {
            // Declare the set
            const set = {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};

            const res = await request(app).post("/api/set").send(set).expect(401);

            // Check the body is empty
            expect(res.body).toEqual({});
        });

        // Test creating a set without a description
        test("Create a set without a description", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = {title:"title", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};

            const res = await request(app).post("/api/set").send(set)
                .set("Authorization", "bearer " + user.body.token).expect(200);

            // Check the set was created successfully
            expect(res.body).toBeDefined();
            expect(res.body.title).toBe(set.title);
            expect(res.body.description).not.toBeDefined();
            expect(res.body.public).toBe(set.public);
            expect(res.body.cards.length).toBe(set.cards.length);
        });

        // Test creating a set without a visibility setting
        test("Create a set without a visibility setting", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = {title:"title", description:"desc", cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};

            const res = await request(app).post("/api/set").send(set)
                .set("Authorization", "bearer " + user.body.token).expect(200);

            // Check the set was created successfully
            expect(res.body).toBeDefined();
            expect(res.body.title).toBe(set.title);
            expect(res.body.description).toBe(set.description);
            expect(res.body.public).toBe(false);
            expect(res.body.cards.length).toBe(set.cards.length);
        });

        // Test creating a duplicate set
        test("Create a duplicate set", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};
            
            // Create two of the set
            await createSet(set, "name");
            const res = await request(app).post("/api/set").send(set)
                .set("Authorization", "bearer " + user.body.token).expect(200);

            // Check the second set was created successfully
            expect(res.body).toBeDefined();
            expect(res.body.title).toBe(set.title);
            expect(res.body.description).toBe(set.description);
            expect(res.body.public).toBe(set.public);
            expect(res.body.cards.length).toBe(set.cards.length);
        });

        // Test creating a set without a title
        test("Create a set without a title", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = { description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};
            
            const res = await request(app).post("/api/set").send(set)
                .set("Authorization", "bearer " + user.body.token).expect(400);

            // Check the set was not created
            expect(res.body).toEqual({});
        });

        // Test creating a set without any cards
        test("Create a set without any cards", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = {title:"title", description:"desc", public: true, cards: []};
            
            const res = await request(app).post("/api/set").send(set)
                .set("Authorization", "bearer " + user.body.token).expect(400);

            // Check the set was not created
            expect(res.body).toEqual({});
        });

        // Test creating a set with undefined cards
        test("Create a set with undefined cards", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = {title:"title", description:"desc", public: true};
            
            const res = await request(app).post("/api/set").send(set)
                .set("Authorization", "bearer " + user.body.token).expect(400);

            // Check the set was not created
            expect(res.body).toEqual({});
        });

        // Test creating an undefined set
        test("Create an undefined set", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            
            const res = await request(app).post("/api/set").send(undefined)
                .set("Authorization", "bearer " + user.body.token).expect(400);

            // Check the set was not created
            expect(res.body).toEqual({});
        });

    });

    // Test the delete endpoint for deleting sets
    describe("Testing deleting sets by id", () => {

        // Delete a set with a valid id while logged in
        test("Delete a set with a valid id while logged in", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            expect(set).toBeDefined();

            await request(app).delete("/api/set/" + set.id)
                .set("Authorization", "bearer " + user.body.token).expect(204);

            expect(await getSet(set.id)).not.toBeDefined();
        });

        // Delete a valid set while not logged in
        test("Delete a set with a valid id while logged in", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            expect(set).toBeDefined();

            await request(app).delete("/api/set/" + set.id).expect(401);

            // Check the set was not deleted 
            expect(await getSet(set.id)).toEqual(set);
        });

        // Delete a valid set while logged in as another user
        test("Delete a set with a valid id while logged in", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name2", password: "password"}).expect(200);
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            expect(set).toBeDefined();

            await request(app).delete("/api/set/" + set.id)
                .set("Authorization", "bearer " + user.body.token).expect(403);

            // Check the set was not deleted
            expect(await getSet(set.id)).toEqual(set);
        });

        // Delete a set with an invalid id while logged in
        test("Delete a set with an invalid id while logged in", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            // Assert the set does not exist
            expect(await getSet("fakeID")).not.toBeDefined();

            await request(app).delete("/api/set/fakeID")
                .set("Authorization", "bearer " + user.body.token).expect(204);

            // Assert the set does not exist
            expect(await getSet("fakeID")).not.toBeDefined();
        });

        // Delete a set with an invalid id of length 24
        test("Delete a set with an invalid id of length 24", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            // Assert the set does not exist
            expect(await getSet("66b491a970c9eac4c3a1c17b")).not.toBeDefined();

            await request(app).delete("/api/set/66b491a970c9eac4c3a1c17b")
                .set("Authorization", "bearer " + user.body.token).expect(204);

            // Asser the set does not exist
            expect(await getSet("66b491a970c9eac4c3a1c17b")).not.toBeDefined();
        });

    });

    // Test the put endpoint for updating the details of sets
    describe("Testing updating the details of a set", () => {

        const VALID_UPDATES = [
            {title: "newTitle", description: "newDescription", public: false, cards: [{term: {file: false, content: "newTerm"}, definition:  {file: false, content: "newDef"}}]}, // All new fields
            {title: "newTitle", public: true, cards: [{term: {file: false, content: "newTerm"}, definition:  {file: false, content: "newDef"}}]}, // No description
            {title: "newTitle", description: "newDescription", cards: [{term: {file: false, content: "newTerm"}, definition:  {file: false, content: "newDef"}}]} // No public field
        ];

        const INVALID_UPDATES = [
            {description: "newDescription", public: true, cards: [{term: {file: false, content: "newTerm"}, definition:  {file: false, content: "newDef"}}]}, // No title
            {title: "newTitle", description: "newDescription", public: true, cards: []}, // Cards length 0
            {title: "newTitle", description: "newDescription", public: true }, // No cards    
            {}, // Update has not fields
            undefined // Update is not defined
        ];

        // Test valid updates to sets
        test.each(VALID_UPDATES)("Update a set with valid details while logged in", async (update) => {
            // Create a set to update and the user that created the set
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            expect(set).toBeDefined();

            // Update the set
            const res = await request(app).put("/api/set/" + set.id).send(update)
                .set("Authorization", "bearer " + user.body.token).expect(200);

            // Check that the update happened
            expect(res.body.title).toBe(update.title);
            expect(res.body.description).toBe(update.description);
            expect(res.body.cards.length).toBe(update.cards.length);
            if(update.public) expect(res.body.public).toBe(true);
            else expect(res.body.public).toBe(false);
        });

        // Test invalid updates to sets
        test.each(INVALID_UPDATES)("Update a set with invalid details while logged in", async (update) => {
            // Create a set to update and the user that created the set
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            expect(set).toBeDefined();

            // Update the set
            const res = await request(app).put("/api/set/" + set.id).send(update)
                .set("Authorization", "bearer " + user.body.token).expect(400);

            // Check that the update did not occur
            expect(res.body).toEqual({});
            expect(await getSet(set.id)).toEqual(set);
        });

        // Test updating a set while not logged in
        test("Update a set while not logged in", async () => {
            // Create a set to update and the user that created the set
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            expect(set).toBeDefined();

            // Update the set
            const res = await request(app).put("/api/set/" + set.id).send({title:"title2", description:"desc2", public: true, cards: [{term: "term2", definition: "def2"}]})
                .expect(401);

            // Check that the update did not occur
            expect(res.body).toEqual({});
            expect(await getSet(set.id)).toEqual(set);
        });

        // Test updating a set while logged in as a different user
        test("Update a set while logged in as a different user", async () => {
            // Create a set to update and the user that created the set
            const user = await request(app).post("/api/user/register").send({username: "name2", password: "password"}).expect(200);
            const set = await createSet({title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]}, "name");
            expect(set).toBeDefined();

            // Update the set
            const res = await request(app).put("/api/set/" + set.id).send({title:"title2", description:"desc2", public: true, cards: [{term: "term2", definition: "def2"}]})
                .set("Authorization", "bearer " + user.body.token).expect(403);

            // Check that the update did not occur
            expect(res.body).toEqual({});
            expect(await getSet(set.id)).toEqual(set);
        });

        // Test updating a set that does not exist
        test("Update a set that does not exist", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const update = {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};
            // Update the set
            const res = await request(app).put("/api/set/fakeID").send(update)
                .set("Authorization", "bearer " + user.body.token).expect(404);

            // Check that the result is undefined
            expect(res.body).toEqual({});
        });

        // Test updaing a set that does not exist with an id of length 24
        test("Update a set that does not exist with an id of length 24", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            const update = {title:"title", description:"desc", public: true, cards: [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}]};
            // Update the set
            const res = await request(app).put("/api/set/66b491a970c9eac4c3a1c17b").send(update)
                .set("Authorization", "bearer " + user.body.token).expect(404);

            // Check that the result is undefined
            expect(res.body).toEqual({});
        });

    });
    
    
});