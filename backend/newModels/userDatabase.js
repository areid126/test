// Code loosly based on pervious submission for Assignment-1 (Abbey)
const config = require("../utils/config");
const { openMongoose, asyncOpenMongoose } = require("../utils/mongoose");
const  jwt = require("jsonwebtoken");
const { changeCreator, deleteSets, getSet } = require("./setDatabase");


let User = undefined;



async function setUpUser() {
    if(User) return;

    const mongoose = await asyncOpenMongoose();

    // Create a schema for user objects
    const userSchema = new mongoose.Schema({
        username: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        token: String,
        savedSets: [{ type: String, ref: 'Set' }]
    }, { id: false });

    // Configure how the toObject function acts on user objects
    userSchema.options.toObject = {
        transform: (doc, ret) => {
            delete ret._id
            delete ret.__v
        }
    };

    // Create a user object model
    User = mongoose.model("User", userSchema, "Users");
}

async function createUser(user) {
    if(!User) await setUpUser();

    // Check that the user is in the correct format
    if (user && user.username && user.password) {

        // Check if that username already exists
        const res = await User.find({ username: user.username });

        if (res.length === 0) {
            const newUser = new User({
                username: user.username,
                password: user.password,
                // Create a token for the user
                token: jwt.sign({username : user.username}, process.env.JWT_SECRET)
            });

            await newUser.save();
            return newUser.toObject();
        }
    }

    // If there was an error creating the user return undefined
    return undefined;
}

async function getUser(username) {
    if(!User) await setUpUser();

    const users = (await User.find({ username: username })).map(user => user.toObject());
    return users[0];
}

async function getUsers() {
    if(!User) await setUpUser();

    return (await User.find({})).map(user => user.toObject());
}


async function deleteUser(username) {
    if(!User) await setUpUser();

    // Find the user and remove them if they exist
    await User.findOneAndDelete({ username: username });

    // Delete all the sets related to the user (which will delete all the cards in the sets as well)
    await deleteSets(username);
}

async function updateUser(username, newUsername, newPassword) {
    if(!User) await setUpUser();


    // If the new password and username are provided and the username does not already exist or is not being changed
    if(newUsername && newPassword && (username === newUsername || (await User.find({ username: newUsername })).length === 0)){

        // Find and update the user
        const user = (await User.findOneAndUpdate({ username: username }, {
            $set: {
                username: newUsername,
                password: newPassword, 
                token: jwt.sign({username : newUsername}, process.env.JWT_SECRET)
            }
        }, {new: true}));

        if(user) {
            // Change all the sets the user created if their username is updated
            if (username !== newUsername) await changeCreator(username, newUsername);
            return user.toObject();
        }
    }
    
    // If the update fails return undefined
    return undefined;
}

async function verifyUser(token) {
    if(!User) await setUpUser();

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        return await getUser(decodedToken.username);
    } catch (err) {
        return undefined;
    }
}

// Function that drops the whole database for use during testing only
async function deleteAllUsers() {
    if(!User) await setUpUser();

    // Only delete all if running in test mode
    if(config.MODE === "test") await User.deleteMany({});
}

// Function to update the saved sets of a user
async function updateSavedSets(username, setId) {
    if(!User) await setUpUser();


    try {
        const setExists = await getSet(setId);

        if (!setExists) {
            console.error("Set not found or has been deleted");
            return { success: false, message: "Set not found or has been deleted" };
        }


        const updatedUser = await User.findOneAndUpdate(
            { username: username },
            { $addToSet: { savedSets: setId } },
            { new: true }
        );


        if (!updatedUser) {

            return { success: false, message: "User not found" };
        }

        return { success: true, message: "Set saved successfully", user: updatedUser.toObject() };

    } catch (error) {

        return { success: false, message: "Error updating saved sets", error: error.message };
    }
}


// Function to close the connection
async function closeUserConnection() {
    if(config.MODE === "test") (await asyncOpenMongoose()).disconnect();
}

// Export functions for use in other files
module.exports = {
    getUsers,
    createUser,
    deleteUser,
    getUser,
    verifyUser,
    updateUser,
    deleteAllUsers,
    updateSavedSets,
    closeUserConnection
}