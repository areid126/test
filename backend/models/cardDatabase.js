const mongoose = require("mongoose");
const config = require("../utils/config");

// Connection string
const url = config.MONGODB_URL;

// Connect to the database
mongoose.set('strictQuery', false);
mongoose.connect(url);

// Create a schema for user objects
const cardSchema = new mongoose.Schema({
    term: {file: Boolean, content: String},
    definition: {file: Boolean, content: String},
    set: String
}, { id: false });

// Configure how the toObject function acts on user objects
cardSchema.options.toObject = {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
    }
};

// Create a user object model
const Card = mongoose.model("Card", cardSchema, "Cards");

async function createCard(card, setID) {

    // Check that the card is in the correct format
    if (card && card.term && card.definition && card.term.content && card.definition.content && setID) {

        const newCard = new Card({
            term: card.term,
            definition: card.definition,
            set: setID
        });

        await newCard.save();
        return newCard.toObject();

    }

    // If there was an error creating the card return undefined
    return undefined;
}

async function createCards(cards, setID) {
    const createdCards = [];
    if(cards && cards.length > 0 && setID) {
        // Create all the cards in the set
        for (let card of cards) {
            let newCard = await createCard(card, setID);
            if(newCard) createdCards.push(newCard);
        }
    }
    return createdCards;
}

async function getCards(setID) {
    const cards = (await Card.find({ set: setID })).map(card => card.toObject());
    return cards;
}

async function getImageCard(fileID) {
    console.log(fileID);
    const card = await Card.findOne({$or: [{"term.file": true, "term.content": fileID}, {"definition.file": true, "definition.content": fileID}]});
    
    if(card) return card.toObject();
    return undefined;
}

async function deleteCards(setID) {
    await Card.deleteMany({set: setID});
}

async function getCard(id) {
    if (id && id.length === 24) {
        const cards = await Card.find({ _id: mongoose.Types.ObjectId.createFromHexString(id) });
        return cards.map(card => card.toObject())[0];
    }
    return undefined;
}

async function deleteCard(id) {
    if (id && id.length === 24) await Card.findOneAndDelete({ _id: mongoose.Types.ObjectId.createFromHexString(id) });
}

async function updateCard(id, newCard) {

    // Make sure the id is the correct length
    if (id && id.length === 24 && newCard && newCard.term && newCard.definition) {
        
        const card = await Card.findByIdAndUpdate(mongoose.Types.ObjectId.createFromHexString(id), {
            $set: {
                term: newCard.term, 
                definition: newCard.definition
            }}, {new: true})

        // If the card is defined return it
        if(card) return card.toObject();
    }
      
    // If the update fails return undefined
    return undefined;
}

// Function that drops the whole database for use during testing only
async function deleteAllCards() {
    // Only delete all if running in test mode
    if(config.MODE === "test") await Card.deleteMany({});
}

// Function to close the connection
async function closeCardConnection() {
    if(config.MODE === "test") await mongoose.disconnect();
}

// Export functions for use in other files
module.exports = {
    createCard,
    createCards,
    deleteCard,
    deleteCards,
    updateCard,
    getCard,
    getCards,
    getImageCard,
    deleteAllCards,
    closeCardConnection
}