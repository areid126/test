// End point to verify logged in users
const setToken = (req, res, next) => {

    // If the token cookie is set then read it from the cookie
    if(req.cookies.token) req.token = req.cookies.token;
    else {
        // Get the authorisation header
        const authorisation = req.header("Authorization");

        // If it is defined then set the token value
        if(authorisation) req.token = authorisation.split(" ")[1];
    }
    
    next();
};

module.exports = { setToken }