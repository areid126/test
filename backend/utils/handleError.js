const handleError = (err, req, res, next) => {
    console.log("middleware is handling the error");
    const status = err.statusCode || 500;
    
    res.status(status).send(); // Send the user the error status if something went wrong

    // Print the details of the error
    console.log({
        status: status,
        message: err.message,
        stack: err.stack
    });
}

module.exports = { handleError }