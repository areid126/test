// require('leaked-handles').set({
//     fullStack: true, // use full stack traces
//     timeout: 30000, // run every 30 seconds instead of 5.
//     debugSockets: true // pretty print tcp thrown exceptions.
// });

// Set up supertest
const request = require("supertest");
const app = require("../app");
const { deleteAllUsers, createUser, getUser, closeUserConnection } = require("../newModels/userDatabase");
const { closeCardConnection } = require("../newModels/cardDatabase");
const { closeFileConnection } = require("../newModels/fileDatabase");
const { closeSetConnection } = require("../newModels/setDatabase");
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

describe("Testing the backend user API", () => {

    // Run all tests in a test database
    beforeAll(async () => {
        // Delete the content of the database before all the tests
        await deleteAllUsers();
    });

    
    afterEach(async () => {
        // Delete the content of the database after each test
        await deleteAllUsers();
    });

    // Close the database connection after running all the code
    afterAll(async () => {
        // await closeUserConnection();
        // await closeCardConnection();
        // await closeFileConnection();
        // await closeSetConnection();
        // await supertest.close();
        // await request(app).close();
        // await app.close();
    });

    const INVALID_BODY = [
        {password: "password"}, // No username
        {username: "name"}, // No password
        {}, // Empty body
        undefined // Undefined body
    ];

    // Test post /register
    describe("Testing the post endpoint for registering new users", () => {

        // Test registering a valid account
        test("Register a valid account", async () => {

            // Try to register the user
            const res = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);

            expect(res.body).toBeDefined();
            expect(res.body.username).toBe("name");
            expect(res.body.token).toBeDefined();
        });

        // Test registering an already taken username
        test("Register an already taken username", async () => {
            const user = await createUser({username: "name", password: "password"});
            expect(user).toBeDefined();

            // Try to register the new user
            const res = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(409);

            expect(res.body).toEqual({});
        });

        // Test registering with an invalid body
        test.each(INVALID_BODY)("Test registering with an invalid body", async (body) => {
            
            const res = await request(app).post("/api/user/register").send(body).expect(400);

            // Expect the response body to be empty
            expect(res.body).toEqual({});
        });
    });

    // Test post /login
    describe("Testing the post endpoint for logging users in", () => {

        const INVALID_LOGIN = [
            {username: "fakeName", password: "password"}, // Invalid username
            {username: "name", password: "fakePassword"} // Invalid password
        ];

        // Test logging in with a valid body
        test("Login with valid user credentials", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            // Try to login as the user
            const res = await request(app).post("/api/user/login").send({username: "name", password: "password"}).expect(200);

            expect(res.body).toBeDefined();
            expect(res.body.username).toBe(user.body.username);
            expect(res.body.token).toBe(user.body.token);
        });

        // Test logging in with a invalid body
        test.each(INVALID_BODY)("Log in with invalid credentials", async (body) => {

            const res = await request(app).post("/api/user/login").send(body).expect(400);

            // Expect the response body to be empty
            expect(res.body).toEqual({});
        });

        // Test logging in with an invalid login
        test.each(INVALID_LOGIN)("Log in with an invalid login", async (body) => {
            // Create a user
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            const res = await request(app).post("/api/user/login").send(body).expect(401);

            // Expect the response body to be empty
            expect(res.body).toEqual({});
        });

    });

    // Test get /logout
    describe("Testing the logout end point", () => {

        // Test that the endpoint returns 201
        test("Logout endpoint returns 201", async () => {
            const res = await request(app).get("/api/user/logout").expect(201);
            // Expect the response body to be empty
            expect(res.body).toEqual({});
        })
    });

    // Test put /:username
    describe("Testing updating a user by their username", () => {
        
        // Test updating a user when authorised
        test("Update a user when authorised to update the user", async () => {
            // Create a user
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            // Update the user's details
            const res = await request(app).put("/api/user/name")
                .send({username: "newName", password: "newPassword"})
                .set("Authorization", "bearer " + user.body.token).expect(200);

            // Check the update went through
            expect(res.body).toBeDefined();
            expect(res.body.username).toBe("newName");
            expect(res.body.username).not.toBe(user.body.username);
            expect(res.body.token).not.toBe(user.body.token);
        });

        // Test updating a user when not logged in
        test("Update a user when not logged in", async () => {
            // Create a user to update
            const user = await createUser({username: "name", password: "password"});
            expect(user).toBeDefined();

            const res = await request(app).put("/api/user/name").send({username: "newName", password: "newPassword"}).expect(401);


            // Expect the response body to be empty
            expect(res.body).toEqual({});
            const newUser = await getUser("name");
            expect(newUser).toEqual(user);
        });

        // Test updating user when logged in as someone else
        test("Update a user when logged in as another user", async () => {
            // Create a user do to the update
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();


            // Create another user to update
            const user2 = await createUser({username: "name2", password: "password"});

            const res = await request(app).put("/api/user/name2")
                .send({username: "newName", password: "newPassword"})
                .set("Authorization", "bearer " + user.body.token).expect(403);

            expect(res.body).toEqual({});
            // Check the user being updated was not updated
            const newUser = await getUser("name2");
            expect(user2).toEqual(newUser);
            // Check the user doing the updating was not updated
            expect(user.body.username).toEqual("name");
        });

        // Test updating a user with an invalid update
        test.each(INVALID_BODY)("Update a user with an invalid body", async (body) => {
            // Create a user do to the update
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            await request(app).put("/api/user/name")
                .send(body)
                .set("Authorization", "bearer " + user.body.token).expect(400);

            // Check the user was not updated
            const res = await request(app).post("/api/user/login").send({username: "name", password: "password"}).expect(200);
            expect(res.body).toEqual(user.body);
        });

        // Test updating a user with a taken username
        test("Update a user with a taken username", async () => {
            // Create a user with the username being updated to
            await createUser({username: "newName", password: "password"});

            // Create a user do to the update
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            await request(app).put("/api/user/name")
                .send({username: "newName", password: "thispassword"})
                .set("Authorization", "bearer " + user.body.token).expect(409);

            // Check the user was not updated
            const res = await request(app).post("/api/user/login").send({username: "name", password: "password"}).expect(200);
            expect(res.body).toEqual(user.body);
        });


        // Test updating a user that does not exist
        test("Update a user that does not exist", async () => {
            // Create a user
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            // Update the user's details
            const res = await request(app).put("/api/user/name2")
                .send({username: "newName", password: "newPassword"})
                .set("Authorization", "bearer " + user.body.token).expect(403);

            expect(res.body).toEqual({});
            // Check the user making the request was not updated
            const res2 = await request(app).post("/api/user/login").send({username: "name", password: "password"}).expect(200);
            expect(res2.body).toEqual(user.body);
        });

    });

    // Test get /verify
    describe("Testing the endpoint for verifying a token", () => {

        // Test verifying with a token that exists
        test("Verify a token that exists", async () => {
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            const res = await request(app).get("/api/user/verify").set("Authorization", "bearer " + user.body.token).expect(200);

            expect(res.body.username).toBe(user.body.username);
            expect(res.body.token).toBe(user.body.token);
        });

        // Test verifyting with a token that does not exist
        test("Verify a token that does not exist", async () => {
            const res = await request(app).get("/api/user/verify").set("Authorization", "bearer madeuptoken").expect(401);

            expect(res.body).toEqual({});
        });

        // Test verifying without a token
        test("Verify a user without a token", async () => {
            const res = await request(app).get("/api/user/verify").expect(401);

            expect(res.body).toEqual({});
        });
    });

    // Test delete /:username
    describe("Testing deleting users by username", () => {

        // Test deleting a user when authorised
        test("Delete a user when authorised to delete the user", async () => {
            // Create a user
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            // Delete the user
            await request(app).delete("/api/user/name").set("Authorization", "bearer " + user.body.token).expect(201);

            // Check the delete went through
            const res = await getUser("name");
            expect(res).not.toBeDefined();

        });

        // Test deleting a user when not logged in
        test("Delete a user when not logged in", async () => {
            // Create a user to delete
            const user = await createUser({username: "name", password: "password"});
            expect(user).toBeDefined();

            await request(app).delete("/api/user/name").expect(401);

            // Expect the user to not be deleted
            const newUser = await getUser("name");
            expect(newUser).toEqual(user);
        });

        // Test deleting a user when logged in as someone else
        test("Delete a user when logged in as another user", async () => {
            // Create a user do to the delete
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();


            // Create another user to delete
            const user2 = await createUser({username: "name2", password: "password"});

            await request(app).delete("/api/user/name2")
                .set("Authorization", "bearer " + user.body.token).expect(403);


            // Check the user being deleted was not deleted
            const newUser = await getUser("name2");
            expect(user2).toEqual(newUser);
            // Check the user doing the deleted was not deleted
            expect(await getUser("name")).toBeDefined();
        });

        // Test deleting a user that does not exist
        test("Delete a user that does not exist", async () => {
            // Create a user
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            // Delete the user. Should return 403 as the authenticated user is not the user being deleted
            await request(app).delete("/api/user/name2").set("Authorization", "bearer " + user.body.token).expect(403);

            // Check the user making the request was not deleted
            const res = await getUser("name");
            expect(res).toBeDefined();
        });

    });

    // Test patch /:username
    describe("Testing patching a users details", () => {

        // Test patching a user when authorised
        test("Patch a user when authorised to update the user", async () => {
            // Create a user
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            // Update the user's details
            const res = await request(app).patch("/api/user/name")
                .send({username: "newName", password: "newPassword"})
                .set("Authorization", "bearer " + user.body.token).expect(200);

            // Check the update went through
            expect(res.body).toBeDefined();
            expect(res.body.username).toBe("newName");
            expect(res.body.username).not.toBe(user.body.username);
            expect(res.body.token).not.toBe(user.body.token);
        });

        // Test only patching a user's username
        test("Patch a user's username only", async () => {
            
            // Create a user
            const user = await createUser({username: "name", password: "password"});
            expect(user).toBeDefined();

            // Update the user's details
            const res = await request(app).patch("/api/user/name")
                .send({username: "newName"})
                .set("Authorization", "bearer " + user.token).expect(200);

            // Check the update went through
            expect(res.body).toBeDefined();
            expect(res.body.username).toBe("newName");
            expect(res.body.username).not.toBe(user.username);

            // Get the user again to make sure the password has not changed
            const newUser = await getUser("newName");
            expect(user.password).toBe(newUser.password);
        });


        // Test patching a user's password only
        test("Patch a user's password only", async () => {

            // Create a user
            const user = await createUser({username: "name", password: "password"});
            expect(user).toBeDefined();

            // Update the user's details
            const res = await request(app).patch("/api/user/name")
                .send({password: "newPassword"})
                .set("Authorization", "bearer " + user.token).expect(200);

            // Check the update went through and the username changed but the password did not
            const newUser = await getUser("name");
            expect(res.body).toBeDefined();
            expect(res.body.username).toBe(user.username);
            expect(newUser.password).not.toBe(user.password);
        });

        // Test patching a user when not logged in
        test("Patch a user when not logged in", async () => {
            // Create a user to patch
            const user = await createUser({username: "name", password: "password"});
            expect(user).toBeDefined();

            const res = await request(app).patch("/api/user/name").send({username: "newName", password: "newPassword"}).expect(401);

            // Expect the response body to be empty
            expect(res.body).toEqual({});
            const newUser = await getUser("name");
            expect(newUser).toEqual(user);
        });

        // Test patching a user when logged in as someone else
        test("Patch a user when logged in as another user", async () => {
            // Create a user do to the patch
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();


            // Create another user to patch
            const user2 = await createUser({username: "name2", password: "password"});

            const res = await request(app).patch("/api/user/name2")
                .send({username: "newName", password: "newPassword"})
                .set("Authorization", "bearer " + user.body.token).expect(403);

            expect(res.body).toEqual({});
            // Check the user being updated was not updated
            const newUser = await getUser("name2");
            expect(user2).toEqual(newUser);
            // Check the user doing the updating was not updated
            expect(user.body.username).toEqual("name");
        });

        // Test patching a user with an empty body
        test("Patch a user with an empty body", async () => {
            // Create a user do to the update
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            await request(app).patch("/api/user/name")
                .send({})
                .set("Authorization", "bearer " + user.body.token).expect(400);

            // Check the user was not updated
            const res = await request(app).post("/api/user/login").send({username: "name", password: "password"}).expect(200);
            expect(res.body).toEqual(user.body);
        });

        // Test patching a user with an undefined body
        test("Patch a user with an undefined body", async () => {
            // Create a user do to the update
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            await request(app).patch("/api/user/name").set("Authorization", "bearer " + user.body.token).expect(400);

            // Check the user was not updated
            const res = await request(app).post("/api/user/login").send({username: "name", password: "password"}).expect(200);
            expect(res.body).toEqual(user.body);
        });

        // Test patching a user with a taken username
        test("Patch a user with a taken username", async () => {
            // Create a user with the username being updated to
            await createUser({username: "newName", password: "password"});

            // Create a user do to the patch
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            await request(app).patch("/api/user/name")
                .send({username: "newName", password: "thispassword"})
                .set("Authorization", "bearer " + user.body.token).expect(409);

            // Check the user was not updated
            const res = await request(app).post("/api/user/login").send({username: "name", password: "password"}).expect(200);
            expect(res.body).toEqual(user.body);
        });


        // Test patching a user that does not exist
        test("Patch a user that does not exist", async () => {
            // Create a user
            const user = await request(app).post("/api/user/register").send({username: "name", password: "password"}).expect(200);
            expect(user.body).toBeDefined();

            // Patch the user's details
            const res = await request(app).patch("/api/user/name2")
                .send({username: "newName", password: "newPassword"})
                .set("Authorization", "bearer " + user.body.token).expect(403);

            expect(res.body).toEqual({});
            // Check the user making the request was not updated
            const res2 = await request(app).post("/api/user/login").send({username: "name", password: "password"}).expect(200);
            expect(res2.body).toEqual(user.body);
        });
    });

});