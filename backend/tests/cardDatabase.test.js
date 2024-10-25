const { deleteAllCards, createCard, createCards, getCards, deleteCards, getCard, deleteCard, updateCard, closeCardConnection } = require("../models/cardDatabase");
const { closeFileConnection } = require("../models/fileDatabase");
const { closeSetConnection } = require("../models/setDatabase");
const { closeUserConnection } = require("../models/userDatabase");

describe.skip("Testing the card database model", () => {

    // Delete the content of the database after running tests
    beforeAll(async () => {
        await deleteAllCards();
    });

    // Delete the content of the database after each test
    afterEach(async () => {
        await deleteAllCards();
    });

    // Close the database connection after running all the code
    afterAll(async () => {
        await closeCardConnection();
        await closeUserConnection();
        await closeFileConnection();
        await closeSetConnection();
    });

    const INVALID_CARDS = [
        {definition: "def"}, // No term
        {term: "term"}, // No definition
        {}, // No fields
        undefined // Undefined
    ];

    // Test creating an individual card
    describe("Testing creating individual cards", () => {

        // Test creating a valid card
        test("Create a valid card", async () => {
            const card = await createCard({term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, "set");

            // Check the card was successfully created
            expect(card).toBeDefined();
            expect(card.term.content).toBe("term");
            expect(card.definition.content).toBe("def");
        });

        // Test creating an invalid card
        test.each(INVALID_CARDS)("Create invalid cards", async (card) => {
            const res = await createCard(card, "set");

            // Check the card was not created
            expect(res).not.toBeDefined();
        })

        // Test creating a card without a set
        test("Create a card with an undefined set", async () => {
            const card = await createCard({term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, undefined);

            // Check the card was not created
            expect(card).not.toBeDefined();
        });

    });

    // Test creating an array of cards
    describe("Testing create an array of cards", () => {

        // Create an array of multiple cards
        test("Create an array of multiple cards", async () => {
            const cards = [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, {term: {file: false, content: "term"}, definition: {file: false, content: "def"}}];

            const res = await createCards(cards, "set");

            expect(res).toBeDefined();
            expect(res.length).toBe(2);
            for(let i in res) {
                expect(res[i].term.content).toBe("term");
                expect(res[i].definition.content).toBe("def");
            }
        });

        // Create an array of invalid cards
        test("Create an array of invalid cards", async () => {
            const res = await createCards(INVALID_CARDS, "set");
            expect(res).toBeDefined();
            expect(res.length).toBe(0);
        })

        // Create an empty array of cards
        test("Create an empty array of cards", async () => {
            const res = await createCards([], "set");
            expect(res).toBeDefined();
            expect(res.length).toBe(0);
        });

        // Create an undefined array of cards
        test("Create an undefined array of cards", async () => {
            const res = await createCards(undefined, "set");
            expect(res).toBeDefined();
            expect(res.length).toBe(0);
        });

        // Create an array of cards with an undefined set
        test("Create an array of cards with an undefined set", async () => {
            const cards = [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, {term: {file: false, content: "term"}, definition: {file: false, content: "def"}}];
            const res = await createCards(cards, undefined);
            expect(res).toBeDefined();
            expect(res.length).toBe(0);
        });
    });

    // Test getting cards by set
    describe("Testing getting cards by the set they are in", () => {

        // Get cards from a set with multiple cards
        test("Get cards from a set with multiple cards", async () => {
            const cards = [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, {term: {file: false, content: "term"}, definition: {file: false, content: "def"}}];
            await createCards(cards, "set");

            // Get all the cards in that set
            const res = await getCards("set");
            
            expect(res).toBeDefined();
            expect(res.length).toBe(2);
            for(let i in res) {
                expect(res[i].term.content).toBe("term");
                expect(res[i].definition.content).toBe("def");
            }
        });

        // Get cards from a set with no cards
        test("Get cards from a set with no cards", async () => {
            // Get all the cards in that set
            const res = await getCards("set");
            expect(res).toBeDefined();
            expect(res.length).toBe(0);
        });

        // Get cards from an undefined set
        test("Get cards from an undefined set", async () => {
            // Add other cards to not get
            const cards = [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, {term: {file: false, content: "term"}, definition: {file: false, content: "def"}}];
            await createCards(cards, "set");

            // Get all the cards in that set
            const res = await getCards(undefined);
            expect(res).toBeDefined();
            expect(res.length).toBe(0);
        });
    });

    // Test deleting cards by set
    describe("Testing deleting cards by the set they are in", () => {

        // Delete cards from a set with multiple cards
        test("Delete cards from a set with multiple cards", async () => {
            const cards = [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, {term: {file: false, content: "term"}, definition: {file: false, content: "def"}}];
            const res1 = await createCards(cards, "set");
            expect(res1).toBeDefined();
            expect(res1.length).toBe(2);

            await deleteCards("set");

            // Get all the cards in that set
            const res2 = await getCards("set");
            
            // Check that the cards were deleted
            expect(res2).toBeDefined();
            expect(res2.length).toBe(0);
        });

        // Get cards from a set with no cards
        test("Delete cards from a set with no cards", async () => {
            // Get all the cards in that set
            const res1 = await getCards("set");
            expect(res1).toBeDefined();
            expect(res1.length).toBe(0);

            await deleteCards("set");

            // Get all the cards in that set
            const res2 = await getCards("set");
            
            // Check that the cards still do not exist
            expect(res2).toBeDefined();
            expect(res2.length).toBe(0);
        });

        // Get cards from an undefined set
        test("Get cards from an undefined set", async () => {
            // Add other cards to not get
            const cards = [{term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, {term: {file: false, content: "term"}, definition: {file: false, content: "def"}}];
            await createCards(cards, "set");

            await deleteCards(undefined);

            // Check that all the cards are still in the set
            const res = await getCards("set");
            expect(res).toBeDefined();
            expect(res.length).toBe(2);
        });
    });


    // Test getting a card by id
    describe("Testing getting a card by its id", () => {

        // Test getting a card that exists
        test("Get a card that exists", async () => {
            const card = await createCard({term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, "set");
            const res = await getCard(card.id);

            // Check the card is the same
            expect(res).toEqual(card);
        });

        // Test getting a card that does not exist
        test("Get a card that does not exist", async () => {
            const res = await getCard("fakeID");
            expect(res).not.toBeDefined();
        });

        // Test getting a card that does not exist with a 24 character id
        test("Get a card that does not exist with a 24 character id", async () => {
            const res = await getCard("66b491a970c9eac4c3a1c17b");
            expect(res).not.toBeDefined();
        });


        // Test getting a card with an undefined id
        test("Get a card with an undefined id", async () => {
            const res = await getCard(undefined);
            expect(res).not.toBeDefined();
        });

    });

    // Test deleting a card by id
    describe("Testing deleting a card by its id", () => {

        // Test deleting a card that exists
        test("Delete a card that exists", async () => {
            const card = await createCard({term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, "set");
            expect(card).toBeDefined();

            await deleteCard(card.id);
        
            const res = await getCard(card.id);

            // Check the card is the same
            expect(res).not.toBeDefined();
        });

        // Test deleting a card that does not exist
        test("Delete a card that does not exist", async () => {
            await deleteCard("fakeID");

            const res = await getCard("fakeID");
            expect(res).not.toBeDefined();
        });

        // Test deleting a card that does not exist with a 24 character id
        test("Delete a card that does not exist with a 24 character id", async () => {
            await deleteCard("66b491a970c9eac4c3a1c17b");

            const res = await getCard("66b491a970c9eac4c3a1c17b");
            expect(res).not.toBeDefined();
        });


        // Test deleting a card with an undefined id
        test("Delete a card with an undefined id", async () => {
            const card = await createCard({term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, "set");
            expect(card).toBeDefined();

            await deleteCard(undefined);

            const res = await getCard(card.id);
            expect(res).toBeDefined();
        });

    });

    // Test updating a card by id
    describe("Testing updating a card by id", () => {

        // Test updating a valid card
        test("Update a valid card", async () => {
            const card = await createCard({term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, "set");
            expect(card).toBeDefined();

            const res = await updateCard(card.id, {term: {file: false, content: "newTerm"}, definition: {file: false, content: "newDef"}});

            expect(res).toBeDefined()
            expect(res.term.content).toBe("newTerm");
            expect(res.definition.content).toBe("newDef");
        });

        // Test updating an invalid card
        test.each(INVALID_CARDS)("Update a card with an invalid card", async (update) => {
            const card = await createCard({term: {file: false, content: "term"}, definition: {file: false, content: "def"}}, "set");
            expect(card).toBeDefined();

            const res = await updateCard(card.id, update);

            expect(res).not.toBeDefined();
            const res2 = await getCard(card.id)
            expect(res2).toEqual(card);
        });

        // Test updating a card that does not exist
        test("Update a card that does not exist", async () => {
            const res = await updateCard("fakeID", {term: {file: false, content: "term"}, definition: {file: false, content: "def"}});
            expect(res).not.toBeDefined();

            // Make sure it does not create the card
            const res2 = await getCard("fakeID");
            expect(res2).not.toBeDefined();
        });

        // Test updating a card that does not exist with an id of length 24
        test("Update a card that does not exist", async () => {
            const res = await updateCard("66b491a970c9eac4c3a1c17b", {term: {file: false, content: "term"}, definition: {file: false, content: "def"}});
            expect(res).not.toBeDefined();

            // Make sure it does not create the card
            const res2 = await getCard("66b491a970c9eac4c3a1c17b");
            expect(res2).not.toBeDefined();
        });

        // Test updating an undefined card
        test("Update a card what is undefined", async () => {
            const res = await updateCard(undefined, {term: {file: false, content: "term"}, definition: {file: false, content: "def"}});
            expect(res).not.toBeDefined();
        });

    });

});