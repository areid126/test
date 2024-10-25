const express = require('express');
const { verifyUser } = require('../models/userDatabase');
const { getSet, createSet, deleteSet, updateSet, getSets } = require('../models/setDatabase');
const router = express.Router();

// Get end point that gets all public sets (also has query parameters for getting a specific users sets + getting private sets)
router.get("/", async (req, res) => {

    let sets;
    // Verify if the user is logged in
    const user = await verifyUser(req.token);

    // If the user is logged in and making a request for their own sets return them all including private sets
    if(user && req.query.user && user.username === req.query.user) sets = await getSets(user.username); // Get only the users cards
    // Get all the public cards by a specific user
    else if(req.query.user && (!user || (user && user.username !== req.query.user))) sets = await getSets(req.query.user, false, true);
    // Get all public cards and any private cards by the user
    else if(user) sets = await getSets(user.username, true); 
    // Get all the public cards
    else sets = await getSets();

    // Respond with the resulting set
    res.json(sets);
});

// Get end point to get a specific set (the cards will be included in the set as an array)
router.get("/:id", async (req, res) => {

    // Get the requested set
    const set = await getSet(req.params.id);
    const user = await verifyUser(req.token);

    if(set && (set.public || (user && set.user === user.username))) res.json(set);
    else if (set && !user) res.status(401).send(); // Send 401 if the user is not logged in
    else if (set && user) res.status(403).send(); // Send 403 if not authorised
    else res.status(404).send(); // Send 404 if set does not exist
});

// Post end point for creating sets
router.post("/", async (req, res) => {

    // console.log("does it not even get here??");
    // console.log(req.body);
    
    // Get the user
    const user = await verifyUser(req.token);
    if(user && req.body) {
        const set = await createSet(req.body, user.username);
        
        // If the set is created return it otherwise send 400 bad request
        if(set) res.json(set);
        else res.status(400).send();
    } 
    // Send 401 if the user is not logged in
    else if(!user) res.status(401).send();
    // Send 400 if there is no request body
    else res.status(400).send();
});

// Delete end point for deleting sets
router.delete("/:id", async (req, res) => {

    // Get the set and the user
    const set = await getSet(req.params.id);
    const user = await verifyUser(req.token);

    // If the user making the request is the user that created the set
    if(user && set && user.username === set.user) {
        await deleteSet(set.id);
        // console.log("deleted set");
        res.status(204).send();
    } 
    
    // Send appropriate error code depending on error
    else if (!user) res.status(401).send();
    else if (!set) res.status(204).send(); // Send 204 if the set does not exist as it has technically already been deleted
    else if (user.username != set.user) res.status(403).send();
});

// Put end point for updating sets
router.put("/:id", async (req, res) => {

    // Get the set and the user
    const set = await getSet(req.params.id);
    const user = await verifyUser(req.token);

    // If the user making the request is the user that created the set
    if(user && set && user.username === set.user) {
        
        const newSet = await updateSet(set.id, req.body)

        if(newSet) res.json(newSet);
        else res.status(400).send();
    } 
    
    // Send appropriate error code depending on error
    else if (!set) res.status(404).send(); // If the set doesnt exist
    else if (!user) res.status(401).send(); // If the user is not logged in
    else if (user.username !== set.user) res.status(403).send(); // If the user did not create the set
});


module.exports = router;