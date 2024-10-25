const config = require("../utils/config");
const { openMongoose, getHexID } = require("../utils/mongoose");
const { createCards, deleteCards, getCards } = require("./cardDatabase");


// Create a schema for user objects
const setSchema = new openMongoose().Schema({
    title: String,
    description: String,
    user: String,
    public: Boolean
}, { id: false});

// Configure how the toObject function acts on set objects
setSchema.options.toObject = {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
    }
};

// Create a user object model
const Set = openMongoose().model("Set", setSchema, "Sets");

async function createSet(set, username) {

    // Check that the set is in the correct format
    if (set && set.title && set.cards && set.cards.length > 0 && username) {
    // need to implement limitations and checks such as character limits or if the set already exists etc.  
        const newSet = new Set({
            title: set.title,
            description: set.description,
            user: username,
            // Set cards to be private by default
            public: (set.public)? true : false
        });

        // Create the new set
        await newSet.save();

        // Create cards for the set
        await createCards(set.cards, newSet._id.toString());
        
        // Return the created set
        return await addCards(newSet.toObject());
    }

    // If there was an error creating the user return undefined
    return undefined;
}

async function getSet(id) {
    // Return the empty set if the id is invalid
    if (id && id.length === 24) {
        const sets = (await Set.find({ _id: getHexID(id) })).map(set => set.toObject());
        
        // If the set exists
        if(sets.length === 1) return await addCards(sets[0]);
    }
    return undefined;
}

// General function for getting sets. User used to indicate the user making the request, all used to indicate whether all public cards should be got
// public to indicate whether only the public cards of a specific user should be gotten. Adding the title field will only get you sets with similar titles
// that match the other provided criteria
async function getSets(username=undefined, all=false, visible=false, title=undefined) {
    let filters = {};
    
    // Get all the cards including the private cards of the user
    if(all && username) filters.$or =  [{ public: true }, { user: username }];
    // Only gets the cards of the user
    else if (!all && username && !visible) filters = { user: username }
    // Only get the public cards of a user
    else if (!all && username && visible) filters = { public: true, user: username };
    // Only gets the public cards
    else filters = { public: true };
    // If there is a provided title then query specifically for sets with that title regardless of case sensitivity
    if(title) filters.title = { $regex:title, $options: "i"};

    const sets = await Set.find(filters);
    // Process the sets before outputing them
    for(let i in sets) sets[i] = await addCards(sets[i].toObject());
    return sets;
}

async function deleteSet(id) {
    // Delete the Set
    if (id && id.length === 24) {
        await Set.findOneAndDelete({ _id: getHexID(id) });

        // Delete the cards related to the set
        await deleteCards(id);
    }
}

async function deleteSets(username) {
    // Delete all the sets all at once
    await Set.deleteMany({user: username});
}

async function updateSet(id, newSet) {

    // Make sure the id is the correct length
    if (id && id.length === 24 && newSet && newSet.title && newSet.cards && newSet.cards.length > 0) {

        const update = {$set: {
            title: newSet.title,
            description: (newSet.description) ? newSet.description : undefined,
            // Set cards to be private by default
            public: (newSet.public)? true : false
        }}

        // Delete the description field if it is not defined in the update
        if(newSet.description === undefined) update.$unset = {"description": ""};

        const set = (await Set.findByIdAndUpdate(getHexID(id), update, {new: true}));

        
        if(set) {
            // Update all the cards in the set (for now just delete them all and then add them again)
            await deleteCards(set._id);
            await createCards(newSet.cards, set._id);
    
            return await addCards(set.toObject());
        }
    }
      
    // If the update fails return undefined
    return undefined;
}

// Function specifically for updating the user associated with a set of cards
async function changeCreator(oldUser, newUser) {
    await Set.updateMany({user: oldUser}, { $set: {user: newUser}});
}

// Create a function that adds an array of a sets cards to the set
async function addCards(set) {
    if(set) {
        const cards = await getCards(set.id);
        set.cards = cards;
        return set;
    }
}

// Function that drops the whole database for use during testing only
async function deleteAllSets() {
    // Only delete all if running in test mode
    if(config.MODE === "test") await Set.deleteMany({});
}

// Function to close the connection
async function closeSetConnection() {
    if(config.MODE === "test") await openMongoose().disconnect();
}

// Export functions for use in other files
module.exports = {
    createSet,
    deleteSet,
    getSet,
    updateSet,
    getSets,
    changeCreator,
    deleteSets,
    deleteAllSets,
    closeSetConnection
}