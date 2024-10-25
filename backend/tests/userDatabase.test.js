const { deleteAllUsers, createUser, getUser, getUsers, deleteUser, updateUser, verifyUser, closeUserConnection } = require("../models/userDatabase");

describe.skip("Testing the user database model", () => {

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
        await closeUserConnection();
    });


    // Test creating a user
    describe("Testing creating a user", () => {


        // Create a user with a username and a password
        test("Creating a user with a username and password", async () => {
            const user = {username: "name", password: "password"};
            const res = await createUser(user);

            // Check that the user was created
            expect(res).toBeDefined();
            expect(res.username).toEqual(user.username);
            expect(res.password).toEqual(user.password);
            expect(res.token).toBeDefined();
        });

        // Create a user without a username
        test("Creating a user without a username", async () => {
            const user = {password: "password"};
            const res = await createUser(user);

            // Check that the user was not created
            expect(res).not.toBeDefined();
        });

        // Create a user without a password
        test("Creating a user without a password", async () => {
            const user = {username: "name"};
            const res = await createUser(user);

            // Check that the user was not created
            expect(res).not.toBeDefined();
        });

        // Create a user without a username or password
        test("Creating a user without a username or password", async () => {
            const user = {};
            const res = await createUser(user);

            // Check that the user was not created
            expect(res).not.toBeDefined();
        });

        // Create a user with an extra field
        test("Creating a user with an extra field", async () => {
            const user = {username: "name", password: "password", extra: "extra"};
            const res = await createUser(user);

            // Check that the user was created
            expect(res).toBeDefined();
            expect(res.username).toEqual(user.username);
            expect(res.password).toEqual(user.password);
            expect(res.token).toBeDefined();
        });

        // User object is undefined
        test("Creating a user when the user object is undefined", async () => {
            const res = await createUser(undefined);

            // Check that the user was not created
            expect(res).not.toBeDefined();
        });

        // Create a user with an already taken username
        test("Creating a user with a username that is taken", async () => {
            await createUser({username: "name", password: "password1"});

            // Create another user with the same name
            const res = await createUser({username: "name", password: "password2"});

            // Check that the user was not created
            expect(res).not.toBeDefined();
        });

        // Create a user with a duplicate password
        test("Creating a user with a duplicate password", async () => {
            await createUser({username: "name1", password: "password"});

            // Create another user with the same password
            const user = {username: "name2", password: "password"};
            const res = await createUser(user);

            // Check that the user was created
            expect(res).toBeDefined();
            expect(res.username).toEqual(user.username);
            expect(res.password).toEqual(user.password);
            expect(res.token).toBeDefined();
        });

    });


    // Test getting a user by username
    describe("Test getting a user by username", () => {

        // Get a user that exists
        test("Getting a user that exists", async () => {
            // Create the user
            const user = {username: "name", password: "password"};
            await createUser(user);

            const res = await getUser("name");

            // Check the user was returned
            expect(res).toBeDefined();
            expect(res.username).toEqual(user.username);
            expect(res.password).toEqual(user.password);
            expect(res.token).toBeDefined();
        });

        // Get a user that does not exist
        test("Getting a user that does not exist", async () => {
            const res = await getUser("name");

            // Check the user does not exist
            expect(res).not.toBeDefined();
        });

        // Get a user with an undefined username
        test("Getting a user with an undefined username", async () => {
            const res = await getUser(undefined);

            // Check the user does not exist
            expect(res).not.toBeDefined();
        });
    });

    // Test getting all users
    describe("Test getting all the users", () => {

        // Get all the users when there are no users
        test("Get all users when there are no users", async () => {
            const res = await getUsers();

            expect(res).toBeDefined();
            expect(res.length).toBe(0);
        });

        // Get all the users when there is only one user
        test("Get all users when there is one user", async () => {
            // Create a user
            await createUser({username: "name", password: "password"});

            // Get all users
            const res = await getUsers();

            // Check that the one user was returned
            expect(res).toBeDefined();
            expect(res.length).toBe(1);
        });
        
        // Get all the users when there are multiple users
        test("Get all users when there are multiple users", async () => {
            // Add three users
            for(let i = 0; i < 3; i++) await createUser({username: "name" + i, password: "password"});
            
            // Get all the users
            const res = await getUsers();

            // Check the users were correctly created
            expect(res).toBeDefined();
            expect(res.length).toBe(3);
        });

    });


    // Test deleting users
    describe("Test deleting users by username", () => {

        // Test deleting a user that exists
        test("Delete a user that exists", async () => {
            // Create a user (and make sure it was created)
            const user = await createUser({username: "name", password: "password"});
            expect(user).toBeDefined();

            // Delete the user
            await deleteUser("name");

            // Check the user was deleted
            expect(await getUser("name")).not.toBeDefined();
        });

        // Test deleting a user that does not exist
        test("Delete a user that does not exist", async () => {
            // Check the user does not exist
            expect(await getUser("name")).not.toBeDefined();

            // Check it does not throw anything
            expect(async () => await deleteUser("name")).not.toThrow();

            // Check the user still does not exist
            expect(await getUser("name")).not.toBeDefined();
        });

        // Test deleting a user with an undefined username
        test("Delete a user with an undefined username", async () => {
            // Check it does not throw anything
            expect(async () => await deleteUser(undefined)).not.toThrow();
        });

    });

    // Test updating users
    describe("Test updating user's details", () => {

        // Test updating a user that exists
        test("Update a user that exists", async () => {
            const oldUser = await createUser({username: "name", password: "password"});
            expect(oldUser).toBeDefined();

            const res = await updateUser("name", "newName", "newPassword");

            expect(res).not.toEqual(oldUser);
            expect(res.username).toBe("newName");
            expect(res.password).toBe("newPassword");
            expect(res.token).not.toEqual(oldUser.token);
        });

        // Test updating a user that does not exist
        test("Update a user that does not exist", async () => {
            const res = await updateUser("name", "newName", "newPassword");

            // Check that the user is not defined
            expect(res).not.toBeDefined();
        });

        // Test updating a user with an undefined new username
        test("Update a user with an undefined new username", async () => {
            const oldUser = await createUser({username: "name", password: "password"});
            expect(oldUser).toBeDefined();

            const res = await updateUser("name", undefined, "newPassword");

            // Check that the user has not changed
            expect(res).not.toBeDefined();
            const res2 = await getUser("name");
            expect(res2.username).toBe(oldUser.username);
            expect(res2.password).toBe(oldUser.password);
            expect(res2.token).toBe(oldUser.token);
        });

        // Test updating a user with an undefined new password
        test("Update a user with an undefined new password", async () => {
            const oldUser = await createUser({username: "name", password: "password"});
            expect(oldUser).toBeDefined();

            const res = await updateUser("name", "newName", undefined);

            // Check that the user has not changed
            expect(res).not.toBeDefined();
            const res2 = await getUser("name");
            expect(res2.username).toBe(oldUser.username);
            expect(res2.password).toBe(oldUser.password);
            expect(res2.token).toBe(oldUser.token);
        });

        // Test updating a user with an undefined old username
        test("Update a user with an undefined old username", async () => {
            const res = await updateUser(undefined, "newName", "newPassword");

            // Check that the user is not defined
            expect(res).not.toBeDefined();
        });

        // Test updating a user with a duplicate new username
        test("Update a user with a duplicate new name", async () => {
            const oldUser = await createUser({username: "name", password: "password"});
            expect(oldUser).toBeDefined();

            // Create new user with another name
            expect(await createUser({username: "newName", password: "password"})).toBeDefined();

            const res = await updateUser("name", "newName", "newPassword");

            // Check that the user has not changed
            expect(res).not.toBeDefined();
            const res2 = await getUser("name");
            expect(res2.username).toBe(oldUser.username);
            expect(res2.password).toBe(oldUser.password);
        });

        // Test updating a user with the same new and old details
        test("Update a user with the same new and old details", async () => {
            const oldUser = await createUser({username: "name", password: "password"});
            expect(oldUser).toBeDefined();

            const res = await updateUser("name", "name", "password");

            // Check that the user has not changed
            expect(res.username).toBe(oldUser.username);
            expect(res.password).toBe(oldUser.password);
        });

        // Test updating only the username of a user
        test("Update a user with only a new username", async () => {
            const oldUser = await createUser({username: "name", password: "password"});
            expect(oldUser).toBeDefined();

            const res = await updateUser("name", "newName", "password");

            // Check that the user has not changed
            expect(res.username).not.toBe(oldUser.username);
            expect(res.username).toBe("newName");
            expect(res.password).toBe(oldUser.password);
            expect(res.token).not.toBe(oldUser.token);
        });

        // Test updating only the password of a user
        test("Update a user with only a new password", async () => {
            const oldUser = await createUser({username: "name", password: "password"});
            expect(oldUser).toBeDefined();

            const res = await updateUser("name", "name", "newPassword");

            // Check that the password has changed
            expect(res.username).toBe(oldUser.username);
            expect(res.password).not.toBe(oldUser.password);
            expect(res.password).toBe("newPassword");
        });

    });

    // Test verifying users
    describe("Test verifying if a user from their token", () => {

        // Test verifying a valid user
        test("Verify a valid user", async () => {
            const user = await createUser({username: "name", password: "password"});

            const res = await verifyUser(user.token);

            // Check that the user was correctly verified
            expect(res).toBeDefined();
            expect(res.username).toEqual(user.username);
            expect(res.password).toEqual(user.password);
            expect(res.token).toEqual(user.token);
        });

        // Test verifying an invalid user
        test("Verify an invalid user", async () => {
            const res = await verifyUser("invalid.token");
            
            // Check the user is not defined
            expect(res).not.toBeDefined();
        });

        // Test verifying a valid user that has been deleted
        test("Verify a valid user that has since been deleted", async () => {
            const user = await createUser({username: "name", password: "password"});

            // Delete the user
            await deleteUser(user.username);
            
            const res = await verifyUser(user.token);
            
            // Check the user is not defined
            expect(res).not.toBeDefined();
        });

    });

});