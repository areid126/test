const express = require('express');
const bcrypt = require("bcrypt");
const { createUser, getUser, updateUser, verifyUser, deleteUser, updateSavedSets } = require('../newModels/userDatabase');
const { getSet } = require('../newModels/setDatabase');
const router = express.Router();


// End point for users to login
router.post("/login", async (req, res) => {
    
    // Check the request body is valid
    if(req.body && req.body.username && req.body.password) {

        // Get the users details from the request body
        const user = await getUser(req.body.username);

        // console.log(req.body.username);
        // console.log(user);

        // If the user has a username and password then verify if they exist
        if (user && await bcrypt.compare(req.body.password, user.password)) {

            // Set the login cookie
            res.cookie("token", user.token, { httpOnly: true });
            res.json({ token: user.token, username: user.username });
        }

        // If the username or password are not valid send 401
        else res.status(401).send();
    }
    // Send 400 if the request is malformed
    else res.status(400).send();
    
});

// End point to logout
router.get("/logout", async (req, res) => {
    res.clearCookie("token"); // Remove the cookie
    res.status(201).send(); // End the request
});

// End point to register a new user account
router.post("/register", async (req, res) => {

    // If the req body has a username and password then create the user
    if (req.body && req.body.username && req.body.password) {

        // Encrypt the password
        const password = await bcrypt.hash(req.body.password, 10);

        // Try and create a new user with those credentials
        const user = await createUser({ username: req.body.username, password: password });

        // If the user is successfully created a token for the user and send it back
        if (user) {
            // Set the login cookie
            res.cookie("token", user.token, { httpOnly: true });
            return res.json({ token: user.token, username: user.username });
        }
        else return res.status(409).send(); // Return 409 conflict if the username is already taken
    }

    // If there are any issues return status code 400
    res.status(400).send();
});

// Put endpoint for updating user details
router.put("/:username", async (req, res) => {

    // Get the logged in user and the user from the provided username
    const currentUser = await verifyUser(req.token);

    // If the two users are the same
    if (currentUser && currentUser.username === req.params.username && req.body && req.body.username && req.body.password
        && (currentUser.username === req.body.username || (currentUser.username != req.body.username && !(await getUser(req.body.username))))) {

        const updatedUser = await updateUser(currentUser.username, req.body.username, await bcrypt.hash(req.body.password, 10));
        // console.log(updatedUser);

        // Send the new token as a response
        res.json({ token: updatedUser.token, username: updatedUser.username });
    }

    // Send different status codes based on the issue
    else if (!currentUser) res.status(401).send();
    else if (currentUser.username !== req.params.username) res.status(403).send();
    else if (req.body && req.body.username && currentUser.username != req.body.username && await getUser(req.body.username)) res.status(409).send();
    else res.status(400).send();
});

// End point to verify logged in users
router.get("/verify", async (req, res) => {

    if (req.token) {
        // send back the user associated with the token
        const user = await verifyUser(req.token);
        if (user) {
            // Set the login cookie
            res.cookie("token", user.token, { httpOnly: true });
            return res.json({ token: user.token, username: user.username });
        }
    }
    // If the user is not logged in then send 401
    res.status(401).send();
});

// Delete a specific user's account
router.delete("/:username", async (req, res) => {
    if(req.token) {
        // Get the curernt user
        const user = await verifyUser(req.token);

        // If the current user is the user being deleted then perform the delete
        if(user && user.username === req.params.username) {
            await deleteUser (user.username);
            res.clearCookie("token"); // Log the user out
            return res.status(201).send(); // Send 201 to confirm success
        } 
        
        else res.status(403).send(); // Send 403 if the correct user is not logged in 
    } 
    
    else res.status(401).send(); // Send 401 if the user is not logged in
});


// Patch a specific user's details
router.patch("/:username", async (req, res) => {

    if(req.token) { 
        // Get the curernt user
        const user = await verifyUser(req.token);
        
        // If the current user is the user having their details patched then patch the details
        if(user && user.username === req.params.username) {

            // Check the request body is defined
            if(req.body && (req.body.password || req.body.username)) {

                let username = user.username;
                let password = user.password;
                
                // Change the requested fields
                if(req.body.password) password = await bcrypt.hash(req.body.password, 10);
                if(req.body.username) username = req.body.username;

                // Return if there is going to be a conflict from the update
                if(username != user.username && await getUser(req.body.username)) return res.status(409).send();
                
                // Update the user's details in the database
                const newUser = await updateUser(user.username, username, password);
                
                // Send the user the updated details
                res.cookie("token", newUser.token, { httpOnly: true });
                res.json({ token: newUser.token, username: newUser.username });
            }

            else res.status(400).send(); // Send 400 if the request is invalid
        } 

        else res.status(403).send(); // Send 403 if the correct user is not logged in 
    }

    else res.status(401).send(); // Send 401 if the user is not logged in
});

// Retrieving saved sets for the user
router.get("/savedSets", async (req, res) => {
    const user = await verifyUser(req.token);

    if (user) {
        // Populate the saved sets
        res.json(user.savedSets);
    } else {
        res.status(401).send();
    }
});

// Save a set to the user's profile
router.post("/saveSet/:setId", async (req, res) => {
    try {
        const user = await verifyUser(req.token);
        const setId = req.params.setId;

        if (user && setId) {
            const result = await updateSavedSets(user.username, setId);
            if (result.success) {
                return res.status(200).json(result.user);
            } else {
                console.error(result.message);
                return res.status(400).json({ error: result.message });
            }
        } else {
            console.error("User or setId is missing");
            return res.status(400).send("User or setId is missing");
        }
    } catch (error) {
        console.error("Error in /saveSet route:", error);
        res.status(500).json({ error: "Server error" });
    }
});



module.exports = router;